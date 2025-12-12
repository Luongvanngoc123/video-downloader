# Video Downloader Web Application

A comprehensive video downloader supporting YouTube, Facebook, TikTok, Instagram, and 1000+ platforms with quality selection and MP3 extraction.

## Features

- ✅ **Multi-Platform Support**: YouTube, Facebook, TikTok, Instagram, and 1000+ sites
- ✅ **Quality Selection**: 4K, 1440p, 1080p60, 1080p, 720p, 480p (auto-detected)
- ✅ **MP3 Extraction**: Extract audio from any video in best quality
- ✅ **LAN Access**: Access from any device on local network
- ✅ **No Watermarks**: TikTok downloads without watermarks (HD quality)

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+ (will be installed automatically on first run)
- ffmpeg (for video merging)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd vmx

# Install dependencies
npm install

# Start server
npm start
```

Server will run on `http://localhost:3001`

## Ubuntu Deployment

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install ffmpeg
sudo apt install -y ffmpeg

# Install Python 3.9+
sudo apt install -y python3 python3-pip
```

### 2. Clone and Setup

```bash
# Clone repository
git clone <your-repo-url>
cd vmx

# Install dependencies
npm install

# Create downloads directory
mkdir -p downloads
mkdir -p tmp_custom

# Set permissions
chmod 755 downloads
chmod 755 tmp_custom
```

### 3. Configure Environment

Create `.env` file in `server/` directory:

```env
PORT=3001
CORS_ORIGIN=*
NODE_ENV=production
```

### 4. Install yt-dlp

```bash
# Install yt-dlp via pip
python3 -m pip install -U yt-dlp
```

### 5. Run with PM2 (Production)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start app.js --name video-downloader

# Setup auto-start on reboot
pm2 startup
pm2 save

# View logs
pm2 logs video-downloader

# Monitor
pm2 monit
```

### 6. Setup Nginx (Optional - for domain)

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/video-downloader
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/video-downloader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp  # If accessing directly
sudo ufw enable
```

## Usage

### Web Interface

1. Navigate to `http://your-server-ip:3001/tool`
2. Paste video URL
3. Click "Get Video Info"
4. Select desired quality or MP3
5. Click to download

### API Endpoints

**Get Video Info:**

```bash
POST /api/video-info
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=..."
}
```

**Download Video:**

```bash
POST /api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=...",
  "formatId": "137"  // or "audio-mp3" for MP3
}
```

## Troubleshooting

### Python/yt-dlp Issues

If downloads fail, install/upgrade yt-dlp:

```bash
python3 -m pip install -U yt-dlp
```

### Port Already in Use

Change port in `.env` file:

```env
PORT=3002
```

### Permission Denied (Downloads)

```bash
chmod -R 755 downloads
chmod -R 755 tmp_custom
```

### YouTube Downloads Failing

Ensure ffmpeg is installed:

```bash
sudo apt install -y ffmpeg
```

## File Structure

```
vmx/
├── app.js              # Entry point
├── server/
│   ├── server.js       # Main server logic
│   └── services/       # API services
├── dist/               # Frontend build
├── downloads/          # Downloaded files
└── tmp_custom/         # Temporary files
```

## Environment Variables

| Variable      | Description | Default     |
| ------------- | ----------- | ----------- |
| `PORT`        | Server port | 3001        |
| `CORS_ORIGIN` | CORS origin | \*          |
| `NODE_ENV`    | Environment | development |

## Author

KhanhWiee

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
