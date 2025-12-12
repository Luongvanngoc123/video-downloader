import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = path.join(__dirname, '../data/settings.json');

// Default settings
const DEFAULT_SETTINGS = {
    customAvatarUrl: "",
    customBackgroundUrl: "",
    backgroundType: "image"
};

// Ensure settings file exists
async function ensureSettingsFile() {
    try {
        await fs.access(SETTINGS_PATH);
    } catch {
        await fs.writeFile(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    }
}

export async function getSettings() {
    await ensureSettingsFile();
    try {
        const data = await fs.readFile(SETTINGS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading settings:', error);
        return DEFAULT_SETTINGS;
    }
}

export async function updateSettings(newSettings) {
    await ensureSettingsFile();
    try {
        const current = await getSettings();
        const updated = { ...current, ...newSettings };
        await fs.writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2));
        return updated;
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
}
