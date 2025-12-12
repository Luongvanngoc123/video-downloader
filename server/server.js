import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import * as EnkaClient from './services/enkaClient.js';
import * as StoreService from './services/storeService.js';
import * as SettingsService from './services/settingsService.js';
import { exec } from 'child_process';
import fs from 'fs';
import archiver from 'archiver';
import https from 'https';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// Tiktok dependency (CommonJS, need dynamic import)
let Tiktok;
(async () => {
    try {
        const module = await import('@tobyg74/tiktok-api-dl');
        Tiktok = module.default || module;
    } catch (e) {
        console.log('TikTok API not available:', e.message);
    }
})();

dotenv.config();

// Setup __dirname for ES modules (needed throughout the file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'genshin-secret-key-123';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

// Initialize store on startup
StoreService.initializeStore();

// --- ROUTES ---

// 1. Profile Route (Merged with Settings)
app.get('/api/profile/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const data = await EnkaClient.fetchEnkaProfile(uid);

        // Merge with custom settings
        const settings = await SettingsService.getSettings();
        if (settings.customAvatarUrl) {
            data.player.profilePicture = settings.customAvatarUrl;
        }

        // Attach settings to response
        data.player.customSettings = settings;

        res.json(data);
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Internal Server Error';
        res.status(status).json({ error: message });
    }
});

// 2. Asset Proxy
app.get('/api/assets/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const ENKA_CDN = process.env.ENKA_CDN || 'https://enka.network/ui';

        const response = await axios.get(`${ENKA_CDN}/${filename}`, {
            responseType: 'stream'
        });

        res.set('Content-Type', response.headers['content-type']);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        response.data.pipe(res);
    } catch (error) {
        console.error(`Asset proxy error for ${req.params.filename}:`, error.message);
        res.status(404).send('Asset not found');
    }
});

// 3. Auth Routes
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
    }

    res.status(401).json({ error: 'Invalid credentials' });
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// 4. Settings Routes
app.get('/api/admin/settings', async (req, res) => {
    const settings = await SettingsService.getSettings();
    res.json(settings);
});

app.post('/api/admin/settings', authenticateToken, async (req, res) => {
    try {
        const updated = await SettingsService.updateSettings(req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// --- VIDEO DOWNLOADER TOOL ROUTES ---

// Downloads directory for video tool (use existing __dirname from bottom of file)
const downloadsDir = path.join(__dirname, '../../downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// Auto-cleanup function
function cleanupOldFiles() {
    fs.readdir(downloadsDir, (err, files) => {
        if (err) return;
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        files.forEach(file => {
            const filePath = path.join(downloadsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                if (now - stats.mtimeMs > oneHour) {
                    fs.unlink(filePath, () => {});
                }
            });
        });
    });
}
setInterval(cleanupOldFiles, 30 * 60 * 1000);

// Serve video downloader HTML at /tool
app.get('/tool', (req, res) => {
    res.sendFile(path.join(__dirname, '../../tool/index.html'));
});

// Serve static files for /tool
app.use('/tool', express.static(path.join(__dirname, '../../tool')));

// Video info endpoint
app.post('/api/video-info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    // TikTok handling with SnapTik Local (with proxy support) + tikwm.com fallback
    if (url.includes('tiktok.com')) {
        try {
            // Try SnapTikClient FIRST (better quality, supports proxy)
            try {
                const SnapTikClient = require('./services/SnapTikClient.cjs');
                const client = new SnapTikClient();
                const result = await client.process(url);
                
                const formats = [];
                
                if (result.type === 'video' && result.data.sources) {
                    // Video sources - usually first is HD, rest are SD/other qualities
                    result.data.sources.forEach((source, index) => {
                        formats.push({
                            formatId: `snaptik-${index}`,
                            quality: index === 0 ? 'HD (No Watermark)' : index === 1 ? 'HD Alt' : 'SD',
                            ext: 'mp4',
                            type: 'video',
                            url: source.url
                        });
                    });
                } else if (result.type === 'slideshow' && result.data.photos) {
                    // Photo slideshow
                    formats.push({
                        formatId: 'images',
                        quality: 'Original',
                        ext: 'jpg',
                        resolution: `${result.data.photos.length} images`,
                        type: 'images',
                        isPhotoCarousel: true
                    });
                }
                
                if (formats.length > 0) {
                    return res.json({
                        title: 'TikTok Video',
                        thumbnail: '',
                        duration: null,
                        uploader: 'TikTok User',
                        platform: 'TikTok (SnapTik Local)',
                        formats,
                        isTikTok: true,
                        tiktokData: result
                    });
                }
            } catch (snaptikError) {
                console.log('SnapTikClient failed, trying tikwm.com...', snaptikError.message);
            }
            
            // Fallback to tikwm.com
            const axios = (await import('axios')).default;
            const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000
            });
            
            if (response.data && response.data.code === 0 && response.data.data) {
                const data = response.data.data;
                const formats = [];
                
                if (data.images && data.images.length > 0) {
                    formats.push({
                        formatId: 'images',
                        quality: 'Original',
                        ext: 'jpg',
                        resolution: `${data.images.length} images`,
                        type: 'images',
                        isPhotoCarousel: true
                    });
                } else {
                    if (data.hdplay) {
                        formats.push({ formatId: 'hd', quality: 'HD (No Watermark)', ext: 'mp4', type: 'video', url: data.hdplay });
                    }
                    if (data.play) {
                        formats.push({ formatId: 'sd', quality: 'SD', ext: 'mp4', type: 'video', url: data.play });
                    }
                }
                
                return res.json({
                    title: data.title || 'TikTok Content',
                    thumbnail: data.cover || '',
                    duration: data.duration || null,
                    uploader: data.author?.nickname || 'TikTok User',
                    platform: 'TikTok (tikwm.com)',
                    formats,
                    isPhotoCarousel: !!(data.images && data.images.length > 0),
                    contentType: data.images ? 'images' : 'video',
                    isTikTok: true,
                    tiktokData: data
                });
            }
            
            return res.status(500).json({ error: "All TikTok APIs failed" });
        } catch (error) {
            console.error('TikTok download error:', error.message);
            return res.status(500).json({ error: "TikTok download failed", details: error.message });
        }
    }

    // --- PYTHON SELECTION LOGIC ---
    const portablePy = path.join(__dirname, '../python_dist/python/bin/python3');
    let pythonCmd = process.platform === 'win32' ? 'python' : '/usr/bin/python3'; 
    
    // Check if we have a working portable python?
    if (process.platform !== 'win32' && fs.existsSync(portablePy)) {
        try {
            // Verify execution permission
            fs.accessSync(portablePy, fs.constants.X_OK);
            pythonCmd = `"${portablePy}"`;
            console.log('Using Portable Python for Info:', pythonCmd);
        } catch(e) { console.log('Portable Python info check failed:', e.message); }
    }

    // Setup Custom TMP env
    const localTmpDir = path.join(__dirname, '../tmp_custom');
    if (!fs.existsSync(localTmpDir)) {
        try { fs.mkdirSync(localTmpDir, { recursive: true }); } catch (e) {}
    }
    const env = { ...process.env, TMPDIR: localTmpDir, TEMP: localTmpDir, TMP: localTmpDir };
    
    // Command construction
    let command;
    let execOptions = { maxBuffer: 1024 * 1024 * 10, env }; 

    // Use Python Module approach (preferred over standalone binary)
    // Added --no-check-certificate to resolve SSL context issues with portable python
    command = `${pythonCmd} -m yt_dlp --no-check-certificate -j "${url}"`;
    
    exec(command, execOptions, (error, stdout, stderr) => {
        if (error) {
            // Save error to global variable for debugging
            global.lastServerError = {
                time: new Date().toISOString(),
                message: error.message,
                stderr: stderr ? stderr.toString() : '',
                command: command
            };
            
            console.error("Exec Error:", error.message);
            console.error("Stderr:", stderr);
            return res.status(500).json({ 
                error: "Failed to fetch video info", 
                details: error ? error.message : 'Unknown error',
                stderr: stderr ? stderr.toString() : ''
            });
        }
        try {
            const info = JSON.parse(stdout);
            
            // Get all video formats including video-only (for max quality like 4K, 8K, 1440p, 1080p60)
            const videoFormats = (info.formats || [])
                .filter(f => f.vcodec && f.vcodec !== 'none') // Has video
                .map(f => ({
                    formatId: f.format_id,
                    quality: f.format_note || f.quality_label || 'Unknown',
                    ext: f.ext,
                    resolution: f.resolution || `${f.width}x${f.height}`,
                    height: f.height,
                    fps: f.fps || 30,
                    filesize: f.filesize,
                    hasAudio: f.acodec && f.acodec !== 'none',
                    vcodec: f.vcodec,
                    acodec: f.acodec
                }));
            
            // Deduplicate and sort by quality (height desc, fps desc)
            const seenQualities = new Set();
            const videoQualityFormats = videoFormats
                .sort((a, b) => {
                    if (b.height !== a.height) return b.height - a.height;
                    return b.fps - a.fps;
                })
                .filter(f => {
                    const key = `${f.height}p${f.fps > 30 ? f.fps : ''}`;
                    if (seenQualities.has(key)) return false;
                    seenQualities.add(key);
                    return true;
                })
                .slice(0, 10) // Show top 10 quality options
                .map(f => ({
                    formatId: f.formatId,
                    quality: `${f.height}p${f.fps > 30 ? f.fps : ''} ${f.hasAudio ? '(Audio)' : ''}`,
                    ext: f.ext,
                    resolution: f.resolution,
                    filesize: f.filesize
                }));

            // Add MP3 audio-only option at the top
            const formats = [
                {
                    formatId: 'audio-mp3',
                    quality: '🎵 MP3 Audio Only (Best Quality)',
                    ext: 'mp3',
                    resolution: 'Audio',
                    filesize: null
                },
                ...videoQualityFormats
            ];

            res.json({
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                uploader: info.uploader,
                platform: info.extractor_key,
                formats
            });
        } catch (e) {
            res.status(500).json({ error: "Failed to parse video data" });
        }
    });
});

// Download endpoint  
app.post('/api/download', async (req, res) => {
    const { url, formatId, isTikTok, tiktokData } = req.body;
    
    if (url.includes('tiktok.com') && isTikTok && tiktokData) {
        try {
            if (tiktokData.images && tiktokData.images.length > 0) {
                // Carousel ZIP download
                const videoId = tiktokData.id || Date.now();
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', `attachment; filename="khanhwiee_${videoId}_carousel.zip"`);
                
                const archive = archiver('zip', { zlib: { level: 9 } });
                archive.pipe(res);
                
                let imageCount = 0;
                for (const imageUrl of tiktokData.images) {
                    try {
                        await new Promise((resolve, reject) => {
                            https.get(imageUrl, (imageRes) => {
                                if (imageRes.statusCode === 200) {
                                    archive.append(imageRes, { name: `image_${++imageCount}.jpg` });
                                    imageRes.on('end', resolve);
                                } else {
                                    reject(new Error(`Failed: ${imageRes.statusCode}`));
                                }
                            }).on('error', reject);
                        });
                    } catch (err) {
                        console.error('Error downloading image:', err);
                    }
                }
                
                await archive.finalize();
                return;
            } else {
                // Video download
                const videoId = tiktokData.id || Date.now();
                const videoUrl = tiktokData.hdplay || tiktokData.play;
                
                if (!videoUrl) {
                    return res.status(500).json({ error: 'Video URL not found' });
                }
                
                const filename = `khanhwiee_${videoId}.mp4`;
                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
                
                https.get(videoUrl, (videoRes) => {
                    if (videoRes.statusCode === 200) {
                        videoRes.pipe(res);
                    } else {
                        res.status(500).json({ error: 'Failed to download video' });
                    }
                }).on('error', () => {
                    res.status(500).json({ error: 'Download error' });
                });
                
                return;
            }
        } catch (error) {
            return res.status(500).json({ error: 'TikTok download failed', details: error.message });
        }
    }
    
    // yt-dlp download for other platforms
    const timestamp = Date.now();
    const outputTemplate = path.join(downloadsDir, `khanhwiee_%(id)s.%(ext)s`);
    
    // --- PYTHON SELECTION LOGIC ---
    const portablePy = path.join(__dirname, '../python_dist/python/bin/python3');
    let pythonCmd = process.platform === 'win32' ? 'python' : '/usr/bin/python3'; 
    
    // Check if we have a working portable python?
    if (process.platform !== 'win32' && fs.existsSync(portablePy)) {
        try {
            // Verify execution permission
            fs.accessSync(portablePy, fs.constants.X_OK);
            pythonCmd = `"${portablePy}"`;
            console.log('Using Portable Python:', pythonCmd);
        } catch(e) { console.log('Portable Python found but not executable:', e.message); }
    }

    // Setup Custom TMP env
    const localTmpDir = path.join(__dirname, '../tmp_custom');
    if (!fs.existsSync(localTmpDir)) {
        try { fs.mkdirSync(localTmpDir, { recursive: true }); } catch (e) {}
    }
    const env = { ...process.env, TMPDIR: localTmpDir, TEMP: localTmpDir, TMP: localTmpDir };
    
    let command;
    let execOptions = { maxBuffer: 1024 * 1024 * 50, env };

    // Use Python Module approach (preferred over standalone binary now)
    // Added --no-check-certificate to fix SSL errors
    // Handle quality selection: specific quality, audio-only (MP3), or best quality
    let formatSelector;
    let outputExt = 'mp4';
    
    if (formatId === 'audio-mp3') {
        // MP3 Audio extraction - get best audio quality and convert to MP3
        formatSelector = 'bestaudio';
        outputExt = 'mp3';
        command = `${pythonCmd} -m yt_dlp --no-check-certificate --no-part -f "${formatSelector}" --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputTemplate}" "${url}"`;
    } else if (formatId && formatId !== 'best') {
        // User selected specific quality - download that exact format + best audio, merge to MP4
        formatSelector = `${formatId}+bestaudio/best`;
        command = `${pythonCmd} -m yt_dlp --no-check-certificate --no-part -f "${formatSelector}" --merge-output-format mp4 -o "${outputTemplate}" "${url}"`;
    } else {
        // No specific format or 'best' selected - download best video+audio
        formatSelector = 'bestvideo+bestaudio/best';
        command = `${pythonCmd} -m yt_dlp --no-check-certificate --no-part -f "${formatSelector}" --merge-output-format mp4 -o "${outputTemplate}" "${url}"`;
    }
    
    exec(command, execOptions, (error, stdout, stderr) => {
        if (error) {
            console.error('Download command failed:', command);
            console.error('Error:', error.message);
            console.error('Stderr:', stderr);
            return res.status(500).json({ 
                error: "Download failed", 
                details: error.message,
                stderr: stderr || ''
            });
        }
        
        const files = fs.readdirSync(downloadsDir)
            .filter(f => f.startsWith('khanhwiee_'))
            .map(f => ({ name: f, time: fs.statSync(path.join(downloadsDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);
        
        if (files.length === 0) {
            return res.status(500).json({ error: "File not found" });
        }
        
        const filePath = path.join(downloadsDir, files[0].name);
        const cleanFilename = files[0].name;
        
        const fileExt = path.extname(cleanFilename).toLowerCase();
        let contentType;
        if (fileExt === '.mp4') {
            contentType = 'video/mp4';
        } else if (fileExt === '.mp3') {
            contentType = 'audio/mpeg';
        } else if (fileExt === '.webm') {
            contentType = 'video/webm';
        } else {
            contentType = 'application/octet-stream';
        }
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        fileStream.on('end', () => {
            setTimeout(() => fs.unlink(filePath, () => {}), 1000);
        });
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- PRODUCTION DEPLOYMENT ---

// --- RECOVERY ROUTE (START) ---
app.get(['/fix-ytdlp', '/tool/fix-ytdlp'], (req, res) => {
    const log = [];
    function addLog(msg) { log.push(msg); console.log(msg); }
    
    addLog('Starting recovery via LEGACY PIP (Python 3.6 support)...');
    addLog('Binary method failed due to hosting "noexec" restrictions.');
    
    // We install the last version of yt-dlp that supports Python 3.6
    // Version: 2023.03.04 (approx)
    const pipCmd = `python3 -m pip install --user "yt-dlp<=2023.03.04"`;
    
    addLog(`Running: ${pipCmd}`);
    
    exec(pipCmd, (error, stdout, stderr) => {
        if (error) {
            addLog(`Pip Install Failed: ${error.message}`);
            addLog(`Stderr: ${stderr}`);
            // Fallback: try without version constraint if that was the issue? 
            // converting error to json
        } else {
            addLog(`Pip Install Output: ${stdout}`);
            addLog('Pip install completed.');
        }

        // Verify module
        const verifyCmd = 'python3 -m yt_dlp --version';
        addLog(`Verifying: ${verifyCmd}`);
        
        exec(verifyCmd, (err, out, serr) => {
            const ver = (out || serr || '').trim();
            if (err) {
                addLog(`Verification Failed: ${err.message}`);
                res.json({ success: false, log });
            } else {
                addLog(`SUCCESS! Installed Legacy yt-dlp version: ${ver}`);
                // Create a marker file or variable to tell server to use module? 
                // Server logic already falls back to "python3 -m yt_dlp" if binary missing.
                // We should ensure binary is REMOVED so it doesn't try to use broken binary
                const brokenBin = path.join(__dirname, '../yt-dlp');
                if (fs.existsSync(brokenBin)) {
                    fs.unlink(brokenBin, () => addLog('Removed broken binary file.'));
                }
                res.json({ success: true, log });
            }
        });
    });
});
// --- RECOVERY ROUTE (END) ---

// --- PYTHON UPGRADE ROUTE (START) ---
app.get(['/fix-python', '/tool/fix-python'], (req, res) => {
    const log = [];
    const addLog = (msg) => { log.push(msg); console.log(msg); };
    
    addLog('Starting Environment Upgrade...');
    addLog('Goal: Install Portable Python 3.9 to support latest yt-dlp.');
    
    // We will install into ../python_dist
    const installDir = path.join(__dirname, '../python_dist');
    const tarFile = path.join(__dirname, '../python.tar.gz');
    
    // 1. Download Portable Python (Indygreg 3.9.18 for Linux)
    // Using 20240107 release as 20240224 might be invalid/missing
    const url = 'https://github.com/indygreg/python-build-standalone/releases/download/20240107/cpython-3.9.18+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz';
    
    exec('curl --version', (err) => {
        if (err) {
            addLog('Error: curl missing.');
            return res.json({ success: false, log });
        }
        
        addLog(`Downloading Python 3.9 from: ${url}`);
        // Add User-Agent to avoid github blocks
        const curlCmd = `curl -L "${url}" -o "${tarFile}" -H "User-Agent: Mozilla/5.0"`;
        
        exec(curlCmd, { maxBuffer: 1024*1024*50 }, (err) => {
            if (err) {
                 addLog(`Download failed: ${err.message}`);
                 return res.json({ success: false, log });
            }
            addLog('Download completed.');
            
            // 2. Extract
            if (!fs.existsSync(installDir)) {
                 fs.mkdirSync(installDir, { recursive: true });
            }
            addLog(`Extracting to ${installDir}...`);
            // tar -xzf file.tar.gz -C target --strip-components=1 (usually inside 'python' folder?)
            // The standalones usually have a top-level folder 'python'
            const tarCmd = `tar -xzf "${tarFile}" -C "${installDir}"`; 
            
            exec(tarCmd, (err2) => {
                if (err2) {
                    addLog(`Extraction failed: ${err2.message}`);
                    return res.json({ success: false, log });
                }
                addLog('Extraction completed.');
                
                // Cleanup tar
                try { fs.unlinkSync(tarFile); } catch(e){}
                
                // 3. Locate Python Binary
                // Usually python_dist/python/bin/python3
                // Note: tar might extract as 'python/...' so inside installDir we have 'python' folder?
                // Let's check.
                // Indygreg builds usually extract to a 'python' directory.
                // So if we extracted to 'python_dist', it might be 'python_dist/python/bin/python3'
                // OR 'python_dist/bin/python3' if we used strip-components? We didn't.
                
                let pyPath = path.join(installDir, 'python', 'bin', 'python3');
                if (!fs.existsSync(pyPath)) {
                    // Try direct?
                     pyPath = path.join(installDir, 'bin', 'python3');
                }
                
                if (!fs.existsSync(pyPath)) {
                     addLog(`Could not locate python3 binary in ${installDir}`);
                     // List dirs to debug
                     try { addLog(`Dir listing: ${fs.readdirSync(installDir).join(', ')}`); } catch(e){}
                     return res.json({ success: false, log });
                }
                
                addLog(`Found binary: ${pyPath}`);
                
                // 4. Install yt-dlp using NEW python
                addLog('Installing latest yt-dlp via pip...');
                const pipCmd = `"${pyPath}" -m pip install yt-dlp`;
                
                exec(pipCmd, (err3, stdout3, stderr3) => {
                     if (err3) {
                         addLog(`Pip install failed: ${err3.message}`);
                         addLog(`Stderr: ${stderr3}`);
                         return res.json({ success: false, log });
                     }
                     addLog(`Pip output: ${stdout3}`);
                     addLog('Successfully installed yt-dlp on Python 3.9!');
                     
                     // Verify
                     exec(`"${pyPath}" -m yt_dlp --version`, (err4, out4) => {
                         const ver = (out4 || '').trim();
                         addLog(`Verified yt-dlp version: ${ver}`);
                         res.json({ success: true, log });
                     });
                });
            });
        });
    });
});
// --- PYTHON UPGRADE ROUTE (END) ---

// --- DEBUG VIEW LAST ERROR ROUTE ---
app.get(['/view-error', '/tool/view-error'], (req, res) => {
    res.json(global.lastServerError || { message: "No errors captured yet." });
});

// --- DEBUG ROUTE (START) ---
app.get(['/debug-info', '/tool/debug-info'], (req, res) => {
    const diagnostic = {
        cwd: process.cwd(),
        node: process.version,
        platform: process.platform,
        python_system: 'Checking...',
        yt_dlp_module: 'Checking...',
        yt_dlp_binary: 'Checking...',
        dir_contents: [],
    };

    // 1. List files in current directory
    try {
        diagnostic.dir_contents = fs.readdirSync(__dirname);
    } catch (e) { diagnostic.dir_contents = e.message; }
    
    // Also check logical parent (app root)
    try {
         diagnostic.root_contents = fs.readdirSync(path.join(__dirname, '../'));
    } catch (e) { diagnostic.root_contents = e.message; }


    // 2. Check Python System
    const pythonCmd = process.platform === 'win32' ? 'python' : '/usr/bin/python3';
    exec(`${pythonCmd} --version`, (err, stdout, stderr) => {
        diagnostic.python_system = err ? `Error: ${err.message}` : (stdout || stderr).trim();

        // 3. Check yt-dlp Module
        exec(`${pythonCmd} -m yt_dlp --version`, (err2, stdout2, stderr2) => {
             diagnostic.yt_dlp_module = err2 ? `Error: ${err2.message}` : (stdout2 || stderr2).trim();

             // 4. Check yt-dlp Binary
             const binPath = path.join(__dirname, '../yt-dlp');
             const binPath2 = path.join(__dirname, 'yt-dlp');
             
             let binCheck = [];
             if (fs.existsSync(binPath)) binCheck.push(`Found at ../yt-dlp`);
             if (fs.existsSync(binPath2)) binCheck.push(`Found at ./yt-dlp`);
             if (binCheck.length === 0) binCheck.push('Not found in ./ or ../');
             
             // Try running binary if exists
             const target = fs.existsSync(binPath) ? binPath : (fs.existsSync(binPath2) ? binPath2 : null);
             
             if (target) {
                 fs.chmodSync(target, '755'); // Try to ensure executable
                 exec(`"${target}" --version`, (err3, stdout3, stderr3) => {
                     diagnostic.yt_dlp_binary = `${binCheck.join(', ')}. Run result: ${(stdout3 || stderr3 || err3.message).trim()}`;
                     finish();
                 });
             } else {
                 diagnostic.yt_dlp_binary = binCheck.join(', ');
                 finish();
             }
        });
    });

    function finish() {
        res.json(diagnostic);
    }
});
// --- DEBUG ROUTE (END) ---

// Serve video downloader tool
app.use('/tool', express.static(path.join(__dirname, '../tool')));
app.use('/tool', express.static(path.join(__dirname, '../public')));

// Serve static files from the React app (dist folder in root) if exists
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // Catchall for React routes - serve dist/index.html
    app.get('*', (req, res) => {
        const distIndex = path.join(__dirname, '../dist/index.html');
        if (fs.existsSync(distIndex)) {
            res.sendFile(distIndex);
        } else {
            res.status(404).json({ error: 'Application not found' });
        }
    });
} else {
    // No dist folder - just serve API endpoints
    app.get('*', (req, res) => {
        res.status(404).json({ 
            error: 'UI not found', 
            message: 'API endpoints are available. Access /tool for video downloader.' 
        });
    });
}

// Start server - Listen on all network interfaces for LAN access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    
    // Display local IP addresses for LAN access
    const interfaces = os.networkInterfaces();
    console.log('Network access:');
    Object.keys(interfaces).forEach(name => {
        interfaces[name].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  http://${iface.address}:${PORT}`);
            }
        });
    });
});
