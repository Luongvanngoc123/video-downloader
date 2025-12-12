// CommonJS loader for cPanel/LiteSpeed
// This file acts as a bridge to load the ESM server
async function startServer() {
    try {
        await import('./server/server.js');
    } catch (err) {
        console.error('Failed to start server:', err);
    }
}

startServer();
