// ===================================
// DOM Elements
// ===================================

const videoUrlInput = document.getElementById('videoUrl');
const fetchBtn = document.getElementById('fetchBtn');
const downloadBtn = document.getElementById('downloadBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('errorMessage');
const videoInfoEl = document.getElementById('videoInfo');
const thumbnailEl = document.getElementById('thumbnail');
const videoTitleEl = document.getElementById('videoTitle');
const uploaderEl = document.getElementById('uploader');
const durationEl = document.getElementById('duration');
const platformEl = document.getElementById('platform');
const qualityOptionsEl = document.getElementById('qualityOptions');
const downloadProgressEl = document.getElementById('downloadProgress');

// ===================================
// State Management
// ===================================

let currentVideoInfo = null;
let selectedFormat = null;

// ===================================
// Utility Functions
// ===================================

function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

function formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
        return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
}

function showError(message, suggestion = null) {
    errorMessageEl.innerHTML = message;
    if (suggestion) {
        errorMessageEl.innerHTML += `<br><br><strong>💡 Gợi ý:</strong> ${suggestion}`;
    }
    showElement(errorEl);
    setTimeout(() => hideElement(errorEl), 8000); // Longer timeout for suggestions
}

function resetUI() {
    hideElement(loadingEl);
    hideElement(errorEl);
    hideElement(videoInfoEl);
    hideElement(downloadProgressEl);
    selectedFormat = null;
    downloadBtn.disabled = true;
}

// ===================================
// API Functions
// ===================================

async function fetchVideoInfo(url) {
    try {
        const response = await fetch('/api/video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.error || 'Failed to fetch video information');
            error.suggestion = data.suggestion;
            throw error;
        }

        return data;
    } catch (error) {
        throw error;
    }
}

async function downloadVideo(url, formatId, quality, isPhotoCarousel = false, isTikTok = false, tiktokData = null) {
    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, formatId, quality, isPhotoCarousel, isTikTok, tiktokData })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to download content');
        }

        // Get the blob from response
        const blob = await response.blob();
        
        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = isPhotoCarousel ? 'tiktok_photos.zip' : 'video.mp4';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

        return true;
    } catch (error) {
        throw error;
    }
}

// Download single image from carousel
async function downloadSingleImage(imageUrl, imageNumber) {
    try {
        // Show loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.textContent = `⏳ Downloading image #${imageNumber}...`;
        loadingMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 9999;
        `;
        document.body.appendChild(loadingMsg);
        
        // Fetch image as blob to bypass CORS
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Create download link
        const videoId = currentVideoInfo?.tiktokData?.id || Date.now();
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `khanhwiee_${videoId}_img${imageNumber}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        
        // Remove loading, show success
        document.body.removeChild(loadingMsg);
        
        const successMsg = document.createElement('div');
        successMsg.textContent = `✓ Image #${imageNumber} downloaded!`;
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successMsg);
        setTimeout(() => {
            successMsg.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(successMsg), 300);
        }, 2000);
    } catch (error) {
        console.error('Download error:', error);
        alert(`Failed to download image #${imageNumber}. Please try again.`);
    }
}

// ===================================
// UI Rendering Functions
// ===================================

function displayVideoInfo(videoInfo) {
    currentVideoInfo = videoInfo;

    // Get thumbnail container (safe check)
    const thumbnailContainer = thumbnailEl?.parentElement;
    if (!thumbnailContainer) {
        console.error('Thumbnail container not found');
        return;
    }

    // Handle photo carousel - show all images
    if (videoInfo.isPhotoCarousel && videoInfo.tiktokData && videoInfo.tiktokData.images) {
        thumbnailContainer.innerHTML = ''; // Clear existing
        
        // Create grid for all images
        const gridDiv = document.createElement('div');
        gridDiv.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; width: 100%;';
        
        videoInfo.tiktokData.images.forEach((imgUrl, index) => {
            const imgWrapper = document.createElement('div');
            imgWrapper.style.cssText = 'position: relative; overflow: hidden; border-radius: 8px;';
            
            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = `Image ${index + 1}`;
            img.style.cssText = 'width: 100%; height: 150px; object-fit: cover; display: block;';
            
            // Download button overlay
            const downloadBtn = document.createElement('button');
            downloadBtn.innerHTML = `⬇️ Download #${index + 1}`;
            downloadBtn.style.cssText = `
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                padding: 6px 12px;
                background: rgba(124, 58, 237, 0.95);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 10;
            `;
            
            downloadBtn.onclick = () => downloadSingleImage(imgUrl, index + 1);
            
            // Show button on hover
            imgWrapper.onmouseenter = () => downloadBtn.style.opacity = '1';
            imgWrapper.onmouseleave = () => downloadBtn.style.opacity = '0';
            
            imgWrapper.appendChild(img);
            imgWrapper.appendChild(downloadBtn);
            gridDiv.appendChild(imgWrapper);
        });
        
        thumbnailContainer.appendChild(gridDiv);
    } else {
        // Regular video - single thumbnail
        // Check if currently showing carousel, restore single image
        const existingGrid = thumbnailContainer.querySelector('div[style*="grid"]');
        if (existingGrid) {
            // Restore single image structure
            thumbnailContainer.innerHTML = '<img id="thumbnail" class="thumbnail" alt="Video Thumbnail">';
            // Re-assign thumbnailEl since we recreated it
            const newThumbnail = document.getElementById('thumbnail');
            if (newThumbnail) {
                newThumbnail.src = videoInfo.thumbnail;
                newThumbnail.alt = videoInfo.title;
            }
        } else {
            // Update existing thumbnail
            if (thumbnailEl) {
                thumbnailEl.src = videoInfo.thumbnail;
                thumbnailEl.alt = videoInfo.title;
            }
        }
    }

    // Set title
    if (videoTitleEl) {
        videoTitleEl.textContent = videoInfo.title;
        
        // Add indicator for photo carousel
        if (videoInfo.isPhotoCarousel) {
            const imageCount = videoInfo.tiktokData?.images?.length || '?';
            videoTitleEl.textContent += ` 📸 (${imageCount} Photos)`;
        }
    }

    // Set uploader
    if (uploaderEl) {
        const uploaderSpan = uploaderEl.querySelector('span');
        if (uploaderSpan && videoInfo.uploader) {
            uploaderSpan.textContent = videoInfo.uploader;
            showElement(uploaderEl);
        } else {
            hideElement(uploaderEl);
        }
    }

    // Set duration
    if (durationEl) {
        const durationSpan = durationEl.querySelector('span');
        if (durationSpan) {
            if (videoInfo.isPhotoCarousel) {
                durationSpan.textContent = 'Photo Content';
            } else {
                durationSpan.textContent = formatDuration(videoInfo.duration);
            }
        }
    }

    // Set platform
    if (platformEl) {
        platformEl.textContent = videoInfo.platform || 'Video';
    }

    // Render quality options
    renderQualityOptions(videoInfo.formats, videoInfo.isPhotoCarousel);

    // Show video info section
    showElement(videoInfoEl);
}

function renderQualityOptions(formats, isPhotoCarousel = false) {
    qualityOptionsEl.innerHTML = '';

    if (!formats || formats.length === 0) {
        qualityOptionsEl.innerHTML = '<p style="color: var(--text-secondary);">No quality options available</p>';
        return;
    }

    formats.forEach((format, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quality-option';
        optionDiv.dataset.formatId = format.formatId;
        optionDiv.dataset.quality = format.quality;
        optionDiv.dataset.isPhotoCarousel = format.isPhotoCarousel || false;

        // Auto-select the first (highest) quality
        if (index === 0) {
            optionDiv.classList.add('selected');
            selectedFormat = format;
            downloadBtn.disabled = false;
        }

        let details = '';
        if (isPhotoCarousel) {
            details = 'All images in ZIP<br><small>Or click images above to download individually</small>';
        } else {
            if (format.resolution) {
                details += format.resolution;
            }
            if (format.fps) {
                details += ` • ${format.fps}fps`;
            }
            if (format.filesize) {
                details += `<br>${formatFileSize(format.filesize)}`;
            }
        }

        optionDiv.innerHTML = `
            <span class="quality-label">${format.quality}</span>
            <div class="quality-details">${details || 'Best quality'}</div>
        `;

        optionDiv.addEventListener('click', () => selectQuality(optionDiv, format));
        qualityOptionsEl.appendChild(optionDiv);
    });
}

function selectQuality(optionElement, format) {
    // Remove selected class from all options
    document.querySelectorAll('.quality-option').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selected class to clicked option
    optionElement.classList.add('selected');

    // Update selected format
    selectedFormat = format;
    downloadBtn.disabled = false;
}

// ===================================
// Event Handlers
// ===================================

fetchBtn.addEventListener('click', async () => {
    const url = videoUrlInput.value.trim();

    if (!url) {
        showError('Please enter a video URL');
        return;
    }

    // Basic URL validation
    try {
        new URL(url);
    } catch (e) {
        showError('Please enter a valid URL');
        return;
    }

    // Reset UI
    resetUI();
    showElement(loadingEl);

    try {
        const videoInfo = await fetchVideoInfo(url);
        hideElement(loadingEl);
        displayVideoInfo(videoInfo);
    } catch (error) {
        hideElement(loadingEl);
        showError(error.message, error.suggestion);
    }
});

downloadBtn.addEventListener('click', async () => {
    if (!selectedFormat || !currentVideoInfo) {
        showError('Please select a quality option');
        return;
    }

    const url = videoUrlInput.value.trim();
    const isPhotoCarousel = currentVideoInfo.isPhotoCarousel || selectedFormat.isPhotoCarousel;
    const isTikTok = currentVideoInfo.isTikTok || false;
    const tiktokData = currentVideoInfo.tiktokData || null;

    // Hide video info and show download progress
    hideElement(videoInfoEl);
    showElement(downloadProgressEl);
    
    // Update progress message for photo carousels
    if (isPhotoCarousel) {
        const progressText = downloadProgressEl.querySelector('p');
        if (progressText) {
            progressText.textContent = 'Downloading images... Please wait';
        }
    }

    try {
        await downloadVideo(url, selectedFormat.formatId, selectedFormat.quality, isPhotoCarousel, isTikTok, tiktokData);
        
        // Show success message
        hideElement(downloadProgressEl);
        showElement(videoInfoEl);
        
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--success), #22c55e);
            color: white;
            padding: 1rem 2rem;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: fadeInDown 0.5s ease;
            font-weight: 600;
        `;
        successDiv.textContent = isPhotoCarousel ? '✓ Images downloaded successfully!' : '✓ Download started successfully!';
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'fadeInUp 0.5s ease reverse';
            setTimeout(() => successDiv.remove(), 500);
        }, 3000);

    } catch (error) {
        hideElement(downloadProgressEl);
        showElement(videoInfoEl);
        showError(error.message);
    }
});

// Allow Enter key to fetch video info
videoUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchBtn.click();
    }
});

// ===================================
// Initial Check
// ===================================

// Check if backend is running
fetch('/api/health')
    .then(response => response.json())
    .then(data => {
        if (!data.ytdlpInstalled) {
            showError('yt-dlp is not installed. Please install it to use this application.');
        }
    })
    .catch(error => {
        console.log('Server check:', error);
    });
