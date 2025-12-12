// Constants for the Genshin Profile Viewer

// Enka Network API base URL
export const ENKA_API_BASE = 'https://enka.network/api';

// Element colors for theming
export const ELEMENT_COLORS = {
    Pyro: '#ff6b2b',
    Hydro: '#4fc3ff',
    Electro: '#b794ff',
    Cryo: '#a0e7ff',
    Anemo: '#74ffb8',
    Geo: '#ffb84f',
    Dendro: '#a5c83b',
};

// Element display names
export const ELEMENT_NAMES = {
    Fire: 'Pyro',
    Water: 'Hydro',
    Electric: 'Electro',
    Ice: 'Cryo',
    Wind: 'Anemo',
    Rock: 'Geo',
    Grass: 'Dendro',
};

// Stat labels for display
export const STAT_LABELS = {
    FIGHT_PROP_HP: 'HP',
    FIGHT_PROP_HP_PERCENT: 'HP%',
    FIGHT_PROP_ATTACK: 'ATK',
    FIGHT_PROP_ATTACK_PERCENT: 'ATK%',
    FIGHT_PROP_DEFENSE: 'DEF',
    FIGHT_PROP_DEFENSE_PERCENT: 'DEF%',
    FIGHT_PROP_ELEMENT_MASTERY: 'Elemental Mastery',
    FIGHT_PROP_CRITICAL: 'CRIT Rate',
    FIGHT_PROP_CRITICAL_HURT: 'CRIT DMG',
    FIGHT_PROP_CHARGE_EFFICIENCY: 'Energy Recharge',
    FIGHT_PROP_HEAL_ADD: 'Healing Bonus',
    FIGHT_PROP_PHYSICAL_ADD_HURT: 'Physical DMG Bonus',
    FIGHT_PROP_FIRE_ADD_HURT: 'Pyro DMG Bonus',
    FIGHT_PROP_WATER_ADD_HURT: 'Hydro DMG Bonus',
    FIGHT_PROP_ELECTRIC_ADD_HURT: 'Electro DMG Bonus',
    FIGHT_PROP_ELEC_ADD_HURT: 'Electro DMG Bonus', // Added variation
    FIGHT_PROP_ICE_ADD_HURT: 'Cryo DMG Bonus',
    FIGHT_PROP_WIND_ADD_HURT: 'Anemo DMG Bonus',
    FIGHT_PROP_ROCK_ADD_HURT: 'Geo DMG Bonus',
    FIGHT_PROP_GRASS_ADD_HURT: 'Dendro DMG Bonus',
};

// Artifact types
export const ARTIFACT_TYPES = {
    EQUIP_BRACER: 'Flower',
    EQUIP_NECKLACE: 'Plume',
    EQUIP_SHOES: 'Sands',
    EQUIP_RING: 'Goblet',
    EQUIP_DRESS: 'Circlet',
};

// Cache duration in milliseconds (5 minutes)
export const CACHE_DURATION = 5 * 60 * 1000;
