import axios from 'axios';
import * as StoreService from './storeService.js';
import dotenv from 'dotenv';

dotenv.config();

const ENKA_BASE_URL = process.env.ENKA_BASE_URL || 'https://enka.network/api';
const USER_AGENT = process.env.USER_AGENT || 'GenshinProfileViewer/2.0';

export async function fetchEnkaProfile(uid) {
    try {
        console.log(`Fetching Enka profile for UID: ${uid}`);
        const response = await axios.get(`${ENKA_BASE_URL}/uid/${uid}`, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        // Ensure store is loaded
        await StoreService.initializeStore();
        const loc = await StoreService.fetchLocalization('vi');

        return parseProfileData(response.data, loc);
    } catch (error) {
        console.error('Enka API Error:', error.message);
        if (error.response) {
            throw { status: error.response.status, message: error.response.statusText };
        }
        throw { status: 500, message: 'Internal Server Error' };
    }
}

function parseProfileData(rawData, loc) {
    const playerInfo = rawData.playerInfo || {};
    const avatarInfoList = rawData.avatarInfoList || [];

    return {
        player: {
            nickname: playerInfo.nickname || 'Unknown',
            uid: rawData.uid,
            level: playerInfo.level || 0,
            worldLevel: playerInfo.worldLevel || 0,
            signature: playerInfo.signature || '',
            achievementCount: playerInfo.finishAchievementNum || 0,
            namecardId: playerInfo.nameCardId || 0,
            namecardIcon: StoreService.getNamecardIcon(playerInfo.nameCardId),
            profilePicture: StoreService.getCharacterIcon(playerInfo.profilePicture?.avatarId),
        },
        characters: avatarInfoList.map(avatar => parseCharacter(avatar, loc))
    };
}

function parseCharacter(avatarInfo, loc) {
    const avatarId = avatarInfo.avatarId;
    const propMap = avatarInfo.fightPropMap || {};
    const equipList = avatarInfo.equipList || [];

    const weapon = equipList.find(e => e.weapon);
    const artifacts = equipList.filter(e => e.reliquary || e.flat?.itemType === 'ITEM_RELIQUARY');

    return {
        id: avatarId,
        name: StoreService.getCharacterName(avatarId, loc),
        element: StoreService.getCharacterElement(avatarId),
        icon: StoreService.getCharacterIcon(avatarId),
        splash: StoreService.getCharacterSplash(avatarId),
        level: avatarInfo.propMap?.['4001']?.val || 1,
        friendship: avatarInfo.fetterInfo?.expLevel || 0,
        constellation: avatarInfo.talentIdList?.length || 0,
        stats: parseStats(propMap),
        weapon: weapon ? parseWeapon(weapon, loc) : null,
        artifacts: artifacts.map(a => parseArtifact(a, loc)),
    };
}

function parseStats(fightPropMap) {
    const formatPercent = (val) => {
        const value = val || 0;
        // If value is already > 1 (e.g. 24.1), don't multiply by 100
        const finalValue = value < 2 ? value * 100 : value;
        return finalValue.toFixed(1);
    };

    return {
        hp: Math.round(fightPropMap['2000'] || 0),
        atk: Math.round(fightPropMap['2001'] || 0),
        def: Math.round(fightPropMap['2002'] || 0),
        em: Math.round(fightPropMap['28'] || 0),
        critRate: formatPercent(fightPropMap['20']),
        critDmg: formatPercent(fightPropMap['22']),
        er: formatPercent(fightPropMap['23']),
    };
}

function parseWeapon(weaponData, loc) {
    const weapon = weaponData.weapon || {};
    const flat = weaponData.flat || {};

    return {
        name: StoreService.getWeaponName(flat.nameTextMapHash, loc),
        level: weapon.level || 1,
        ascension: weapon.promoteLevel || 0,
        refinement: (weapon.affixMap ? Object.values(weapon.affixMap)[0] : 0) + 1,
        rarity: flat.rankLevel || 1,
        icon: flat.icon ? `${process.env.ENKA_CDN || 'https://enka.network/ui'}/${flat.icon}.png` : null,
    };
}

function parseArtifact(artifactData, loc) {
    const reliquary = artifactData.reliquary || {};
    const flat = artifactData.flat || {};

    // Try to get name
    let artifactName = null;
    if (flat.nameTextMapHash && loc[flat.nameTextMapHash]) {
        artifactName = loc[flat.nameTextMapHash];
    } else {
        // Fallback to Vietnamese type names
        const typeNames = {
            'Flower': 'Hoa Sự Sống',
            'Plume': 'Lông Vũ Tử Thần',
            'Sands': 'Cát Đồng Hồ',
            'Goblet': 'Chén Không Gian',
            'Circlet': 'Vương Miện Lý Trí'
        };
        const type = getArtifactType(flat.equipType);
        artifactName = typeNames[type] || type;
    }

    const substats = (flat.reliquarySubstats || []).map(sub => ({
        label: getStatLabel(sub.appendPropId),
        value: formatStat(sub.appendPropId, sub.statValue)
    }));

    let mainStat = null;
    if (flat.reliquaryMainstat) {
        mainStat = {
            label: getStatLabel(flat.reliquaryMainstat.mainPropId),
            value: formatStat(flat.reliquaryMainstat.mainPropId, flat.reliquaryMainstat.statValue)
        };
    }

    return {
        name: artifactName,
        setName: StoreService.getArtifactSetName(flat.setNameTextMapHash, loc),
        type: getArtifactType(flat.equipType),
        level: reliquary.level - 1 || 0,
        rarity: flat.rankLevel || 1,
        mainStat,
        substats,
        icon: StoreService.getArtifactIcon(flat.icon),
    };
}

function getStatLabel(key) {
    const labels = {
        FIGHT_PROP_HP: 'HP',
        FIGHT_PROP_HP_PERCENT: 'HP%',
        FIGHT_PROP_ATTACK: 'ATK',
        FIGHT_PROP_ATTACK_PERCENT: 'ATK%',
        FIGHT_PROP_DEFENSE: 'DEF',
        FIGHT_PROP_DEFENSE_PERCENT: 'DEF%',
        FIGHT_PROP_CRITICAL: 'CRIT Rate',
        FIGHT_PROP_CRITICAL_HURT: 'CRIT DMG',
        FIGHT_PROP_CHARGE_EFFICIENCY: 'Energy Recharge',
        FIGHT_PROP_ELEMENT_MASTERY: 'Elemental Mastery',
    };
    return labels[key] || key;
}

function formatStat(key, value) {
    const isPercent = key.includes('PERCENT') || key.includes('CRITICAL') ||
        key.includes('EFFICIENCY') || key.includes('ADD_HURT');

    if (isPercent) {
        // If value is already > 1 (e.g. 24.1), don't multiply by 100
        // If value is small (e.g. 0.241), multiply by 100
        const finalValue = value < 2 ? value * 100 : value;
        return finalValue.toFixed(1) + '%';
    }
    return Math.round(value).toString();
}

function getArtifactType(equipType) {
    const types = {
        EQUIP_BRACER: 'Flower',
        EQUIP_NECKLACE: 'Plume',
        EQUIP_SHOES: 'Sands',
        EQUIP_RING: 'Goblet',
        EQUIP_DRESS: 'Circlet',
    };
    return types[equipType] || equipType;
}
