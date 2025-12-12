import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ENKA_STORE_BASE = process.env.ENKA_STORE_BASE || 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store';
// Use local proxy for assets
const ASSET_BASE_URL = '/api/assets';

let storeCache = {
    characters: null,
    loc: null,
    loaded: false
};

export async function fetchLocalization(lang = 'vi') {
    if (storeCache.loc) {
        return storeCache.loc[lang] || storeCache.loc.vi || storeCache.loc.en;
    }

    try {
        const response = await axios.get(`${ENKA_STORE_BASE}/loc.json`, {
            headers: { 'Accept': 'application/json' },
            responseType: 'json'
        });
        storeCache.loc = response.data;
        return storeCache.loc[lang] || storeCache.loc.vi || storeCache.loc.en;
    } catch (error) {
        console.error('Failed to fetch localization:', error);
        return {};
    }
}

export async function fetchCharacterStore() {
    if (storeCache.characters) {
        return storeCache.characters;
    }

    try {
        const response = await axios.get(`${ENKA_STORE_BASE}/characters.json`, {
            headers: { 'Accept': 'application/json' },
            responseType: 'json'
        });
        storeCache.characters = response.data;
        return storeCache.characters;
    } catch (error) {
        console.error('Failed to fetch character store:', error);
        return {};
    }
}

export function getCharacterName(characterId, loc) {
    const charData = storeCache.characters?.[characterId];
    if (!charData) return `Character ID ${characterId}`;

    const nameHash = charData.NameTextMapHash;
    if (!nameHash || !loc || !loc[nameHash]) {
        return charData.name || `Character ${characterId}`;
    }
    return loc[nameHash];
}

export function getCharacterElement(characterId) {
    const charData = storeCache.characters?.[characterId];
    if (!charData) return 'Unknown';

    const elementMap = {
        Fire: 'Pyro',
        Water: 'Hydro',
        Electric: 'Electro',
        Ice: 'Cryo',
        Wind: 'Anemo',
        Rock: 'Geo',
        Grass: 'Dendro'
    };
    return elementMap[charData.Element] || charData.Element || 'Unknown';
}

export function getCharacterIcon(characterId) {
    const charData = storeCache.characters?.[characterId];
    if (!charData?.SideIconName) return null;
    return `${ASSET_BASE_URL}/${charData.SideIconName}.png`;
}

export function getCharacterSplash(characterId) {
    const charData = storeCache.characters?.[characterId];
    if (!charData?.SideIconName) return null;
    const baseName = charData.SideIconName.replace('UI_AvatarIcon_Side_', 'UI_Gacha_AvatarImg_');
    return `${ASSET_BASE_URL}/${baseName}.png`;
}

export function getNamecardIcon(namecardId) {
    if (!namecardId) return null;
    return `${ASSET_BASE_URL}/UI_NameCardPic_${namecardId}_P.png`;
}

export function getWeaponIcon(weaponId) {
    return `${ASSET_BASE_URL}/UI_EquipIcon_${weaponId}.png`;
}

export function getWeaponName(weaponHash, loc) {
    return loc[weaponHash] || 'Unknown Weapon';
}

export function getArtifactIcon(iconName) {
    if (!iconName) return null;
    return `${ASSET_BASE_URL}/${iconName}.png`;
}

export function getArtifactSetName(setHash, loc) {
    return loc[setHash] || 'Unknown Set';
}

export async function initializeStore() {
    if (storeCache.loaded) return;
    console.log('Initializing Enka store...');
    try {
        await Promise.all([
            fetchLocalization('vi'),
            fetchCharacterStore()
        ]);
        storeCache.loaded = true;
        console.log('Enka store initialized.');
    } catch (error) {
        console.error('Failed to initialize store:', error);
    }
}
