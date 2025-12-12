# Cấu hình Proxy cho TikTok SnapTik

## Cách 1: Sử dụng biến môi trường (Khuyến nghị)

### Windows PowerShell:

```powershell
# Thiết lập proxy trước khi chạy server
$env:HTTPS_PROXY="http://proxy-server:port"
npm start
```

### Windows CMD:

```cmd
set HTTPS_PROXY=http://proxy-server:port
npm start
```

### Linux/Mac:

```bash
export HTTPS_PROXY="http://proxy-server:port"
npm start
```

## Cách 2: Thêm vào file .env

Tạo/sửa file `.env` trong thư mục `vmx/server`:

```env
HTTPS_PROXY=http://proxy-server:port
HTTP_PROXY=http://proxy-server:port
```

## Ví dụ Proxy Server

### Proxy miễn phí (không khuyến nghị cho production):

```
HTTPS_PROXY=http://proxy.example.com:8080
```

### Proxy có authentication:

```
HTTPS_PROXY=http://username:password@proxy.example.com:808
```

### Socks5 proxy (cần cài thêm socks-proxy-agent):

```
HTTPS_PROXY=socks5://proxy.example.com:1080
```

## Test Proxy

Chạy lệnh test:

```bash
node -e "process.env.HTTPS_PROXY='http://your-proxy:port'; const SnapTikClient = require('./server/services/SnapTikClient.cjs'); const client = new SnapTikClient(); client.process('https://vt.tiktok.com/ZSP6WrD2n/').then(r => console.log('SUCCESS:', r.type)).catch(e => console.error('ERROR:', e.message));"
```

## Kết quả mong đợi

Khi SnapTik Local hoạt động với proxy:

- Platform hiển thị: **"TikTok (SnapTik Local)"** ✅
- Có nhiều quality options hơn
- Tốc độ tải nhanh hơn

Khi proxy không hoạt động:

- Tự động fallback sang: **"TikTok (tikwm.com)"** ✅
- Vẫn tải được video (chất lượng HD + SD)

## Lưu ý

- ⚠️ Không cần proxy cũng vẫn tải được TikTok (dùng tikwm.com)
- ✅ Proxy chỉ cần thiết nếu muốn dùng SnapTik Local
- 🔒 Đảm bảo proxy server an toàn và đáng tin cậy
