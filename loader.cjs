// loader.cjs
// This file allows cPanel (Passenger/LSNode) to load an ES Module application
// by using the dynamic import() syntax supported in CommonJS.

(async () => {
    try {
        await import('./app.js');
    } catch (err) {
        console.error('Failed to load ES Module app:', err);
        process.exit(1);
    }
})();
