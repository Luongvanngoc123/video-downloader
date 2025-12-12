// Data parser for Enka Network API responses
import { STAT_LABELS, ARTIFACT_TYPES } from '../utils/constants';

/**
 * Parse raw Enka API response to app-friendly format
 */
export function parseEnkaData(rawData) {
    const playerInfo = rawData.playerInfo || {};
    const avatarInfoList = rawData.avatarInfoList || [];

    return {
        player: parsePlayerInfo(playerInfo),
        characters: avatarInfoList.map(parseCharacter),
    };
}

/**
 * Parse player information
 */
function parsePlayerInfo(playerInfo) {
    return {
        nickname: playerInfo.nickname || 'Unknown',
        uid: playerInfo.uid || 'N/A',
        level: playerInfo.level || 0,
        worldLevel: playerInfo.worldLevel || 0,
        signature: playerInfo.signature || '',
        achievementCount: playerInfo.finishAchievementNum || 0,
        nameCardId: playerInfo.nameCardId || 0,
        profilePictureId: playerInfo.profilePicture?.id || 0,
        showAvatarInfoList: playerInfo.showAvatarInfoList || [],
    };
}

/**
 * Parse character information
 */
function parseCharacter(avatarInfo) {
    const propMap = avatarInfo.fightPropMap || {};
    const equipList = avatarInfo.equipList || [];

    // Separate weapon and artifacts
    const weapon = equipList.find(e => e.weapon);
    const artifacts = equipList.filter(e => e.reliquary || e.flat?.itemType === 'ITEM_RELIQUARY');

    return {
        avatarId: avatarInfo.avatarId,
        level: avatarInfo.propMap?.['4001']?.val || 0,
        friendship: avatarInfo.fetterInfo?.expLevel || 0,
        constellation: avatarInfo.talentIdList?.length || 0,
        stats: parseStats(propMap),
        weapon: weapon ? parseWeapon(weapon) : null,
        artifacts: artifacts.map(parseArtifact),
        skillLevelMap: avatarInfo.skillLevelMap || {},
    };
}

/**
 * Parse character stats
 */
function parseStats(fightPropMap) {
    const stats = {};

    // Base stats
    stats.hp = Math.round(fightPropMap['2000'] || 0);
    stats.atk = Math.round(fightPropMap['2001'] || 0);
    stats.def = Math.round(fightPropMap['2002'] || 0);
    stats.em = Math.round(fightPropMap['28'] || 0);

    // Percentage stats (convert to %)
    stats.critRate = ((fightPropMap['20'] || 0) * 100).toFixed(1);
    stats.critDmg = ((fightPropMap['22'] || 0) * 100).toFixed(1);
    stats.er = ((fightPropMap['23'] || 0) * 100).toFixed(1);

    // Elemental DMG bonuses
    stats.pyroDmg = ((fightPropMap['40'] || 0) * 100).toFixed(1);
    stats.hydroDmg = ((fightPropMap['42'] || 0) * 100).toFixed(1);
    stats.electroDmg = ((fightPropMap['41'] || 0) * 100).toFixed(1);
    stats.cryoDmg = ((fightPropMap['46'] || 0) * 100).toFixed(1);
    stats.anemoDmg = ((fightPropMap['44'] || 0) * 100).toFixed(1);
    stats.geoDmg = ((fightPropMap['45'] || 0) * 100).toFixed(1);
    stats.dendroDmg = ((fightPropMap['43'] || 0) * 100).toFixed(1);
    stats.physicalDmg = ((fightPropMap['30'] || 0) * 100).toFixed(1);

    return stats;
}

/**
 * Parse weapon information
 */
function parseWeapon(weaponData) {
    const weapon = weaponData.weapon || {};
    const flat = weaponData.flat || {};

    return {
        name: flat.nameTextMapHash || 'Unknown Weapon',
        level: weapon.level || 1,
        ascension: weapon.promoteLevel || 0,
        refinement: (weapon.affixMap ? Object.values(weapon.affixMap)[0] : 0) + 1,
        rarity: flat.rankLevel || 1,
        icon: flat.icon || '',
        stats: flat.weaponStats || [],
    };
}

/**
 * Parse artifact information
 */
function parseArtifact(artifactData) {
    const reliquary = artifactData.reliquary || {};
    const flat = artifactData.flat || {};

    // Parse substats
    const substats = (flat.reliquarySubstats || []).map(substat => ({
        key: substat.appendPropId,
        label: STAT_LABELS[substat.appendPropId] || substat.appendPropId,
        value: formatStatValue(substat.appendPropId, substat.statValue),
    }));

    return {
        name: flat.setNameTextMapHash || 'Unknown Set',
        type: ARTIFACT_TYPES[flat.equipType] || flat.equipType,
        level: reliquary.level - 1 || 0, // Enka returns level+1
        rarity: flat.rankLevel || 1,
        mainStat: flat.reliquaryMainstat ? {
            key: flat.reliquaryMainstat.mainPropId,
            label: STAT_LABELS[flat.reliquaryMainstat.mainPropId] || flat.reliquaryMainstat.mainPropId,
            value: formatStatValue(flat.reliquaryMainstat.mainPropId, flat.reliquaryMainstat.statValue),
        } : null,
        substats,
        icon: flat.icon || '',
    };
}

/**
 * Format stat value for display
 */
function formatStatValue(statKey, value) {
    // Percentage stats
    if (statKey.includes('PERCENT') ||
        statKey.includes('CRITICAL') ||
        statKey.includes('EFFICIENCY') ||
        statKey.includes('ADD_HURT') ||
        statKey.includes('HEAL_ADD')) {
        return (value * 100).toFixed(1) + '%';
    }

    // Flat stats
    return Math.round(value).toString();
}

/**
 * Get element from character ID
 * This is a simplified mapping - in production you'd want a complete mapping
 */
export function getCharacterElement(avatarId) {
    // Simplified element detection based on avatar ID ranges
    // In a real app, you'd use the Enka character data JSON
    const elementMap = {
        10000002: 'Cryo',    // Kaeya
        10000003: 'Anemo',   // Jean
        10000005: 'Anemo',   // Traveler (Anemo)
        10000006: 'Electro', // Lisa
        10000007: 'Anemo',   // Traveler (Anemo)
        10000014: 'Hydro',   // Barbara
        10000015: 'Cryo',    // Kaeya
        10000016: 'Pyro',    // Diluc
        10000020: 'Pyro',    // Razor
        10000021: 'Pyro',    // Amber
        10000022: 'Anemo',   // Venti
        10000023: 'Pyro',    // Xiangling
        10000024: 'Pyro',    // Beidou
        10000025: 'Cryo',    // Xingqiu
        10000026: 'Pyro',    // Xiao
        10000027: 'Geo',     // Ningguang
        10000029: 'Pyro',    // Klee
        10000030: 'Geo',     // Zhongli
        10000031: 'Electro', // Fischl
        10000032: 'Pyro',    // Bennett
        10000033: 'Cryo',    // Tartaglia
        10000034: 'Geo',     // Noelle
        10000035: 'Cryo',    // Qiqi
        10000036: 'Pyro',    // Chongyun
        10000037: 'Cryo',    // Ganyu
        10000038: 'Geo',     // Albedo
        10000039: 'Cryo',    // Diona
        10000041: 'Pyro',    // Mona
        10000042: 'Electro', // Keqing
        10000043: 'Anemo',   // Sucrose
        10000044: 'Pyro',    // Xinyan
        10000045: 'Cryo',    // Rosaria
        10000046: 'Pyro',    // Hu Tao
        10000047: 'Electro', // Kazuha
        10000048: 'Pyro',    // Yanfei
        10000049: 'Cryo',    // Yoimiya
        10000050: 'Pyro',    // Thoma
        10000051: 'Cryo',    // Eula
        10000052: 'Electro', // Raiden Shogun
        10000053: 'Geo',     // Sayu
        10000054: 'Electro', // Kokomi
        10000055: 'Geo',     // Gorou
        10000056: 'Electro', // Sara
        10000057: 'Geo',     // Itto
        10000058: 'Electro', // Yae Miko
        10000059: 'Hydro',   // Ayato
        10000060: 'Dendro',  // Yelan
        10000062: 'Dendro',  // Aloy
        10000063: 'Electro', // Shenhe
        10000064: 'Cryo',    // Yunjin
        10000065: 'Dendro',  // Shinobu
        10000066: 'Hydro',   // Ayaka
        10000067: 'Dendro',  // Collei
        10000068: 'Dendro',  // Dori
        10000069: 'Dendro',  // Tighnari
        10000070: 'Dendro',  // Nilou
        10000071: 'Electro', // Cyno
        10000072: 'Hydro',   // Candace
        10000073: 'Dendro',  // Nahida
        10000074: 'Hydro',   // Layla
        10000075: 'Anemo',   // Wanderer
        10000076: 'Dendro',  // Faruzan
        10000077: 'Pyro',    // Yaoyao
        10000078: 'Cryo',    // Alhaitham
        10000079: 'Dendro',  // Dehya
        10000080: 'Pyro',    // Mika
        10000081: 'Cryo',    // Kaveh
        10000082: 'Dendro',  // Baizhu
    };

    return elementMap[avatarId] || 'Anemo'; // Default to Anemo if unknown
}

/**
 * Get character name from ID
 * Simplified - in production use character data JSON
 */
export function getCharacterName(avatarId) {
    const nameMap = {
        10000002: 'Kaeya',
        10000003: 'Jean',
        10000005: 'Traveler',
        10000006: 'Lisa',
        10000007: 'Traveler',
        10000014: 'Barbara',
        10000015: 'Kaeya',
        10000016: 'Diluc',
        10000020: 'Razor',
        10000021: 'Amber',
        10000022: 'Venti',
        10000023: 'Xiangling',
        10000024: 'Beidou',
        10000025: 'Xingqiu',
        10000026: 'Xiao',
        10000027: 'Ningguang',
        10000029: 'Klee',
        10000030: 'Zhongli',
        10000031: 'Fischl',
        10000032: 'Bennett',
        10000033: 'Tartaglia',
        10000034: 'Noelle',
        10000035: 'Qiqi',
        10000036: 'Chongyun',
        10000037: 'Ganyu',
        10000038: 'Albedo',
        10000039: 'Diona',
        10000041: 'Mona',
        10000042: 'Keqing',
        10000043: 'Sucrose',
        10000044: 'Xinyan',
        10000045: 'Rosaria',
        10000046: 'Hu Tao',
        10000047: 'Kazuha',
        10000048: 'Yanfei',
        10000049: 'Yoimiya',
        10000050: 'Thoma',
        10000051: 'Eula',
        10000052: 'Raiden Shogun',
        10000053: 'Sayu',
        10000054: 'Kokomi',
        10000055: 'Gorou',
        10000056: 'Sara',
        10000057: 'Itto',
        10000058: 'Yae Miko',
        10000059: 'Ayato',
        10000060: 'Yelan',
        10000062: 'Aloy',
        10000063: 'Shenhe',
        10000064: 'Yunjin',
        10000065: 'Shinobu',
        10000066: 'Ayaka',
        10000067: 'Collei',
        10000068: 'Dori',
        10000069: 'Tighnari',
        10000070: 'Nilou',
        10000071: 'Cyno',
        10000072: 'Candace',
        10000073: 'Nahida',
        10000074: 'Layla',
        10000075: 'Wanderer',
        10000076: 'Faruzan',
        10000077: 'Yaoyao',
        10000078: 'Alhaitham',
        10000079: 'Dehya',
        10000080: 'Mika',
        10000081: 'Kaveh',
        10000082: 'Baizhu',
    };

    return nameMap[avatarId] || `Character ${avatarId}`;
}
