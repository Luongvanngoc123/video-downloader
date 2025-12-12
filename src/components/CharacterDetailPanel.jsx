// Character Detail Panel - Hiển thị chi tiết thánh di vật
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CharacterDetailPanel.css';

const ELEMENT_COLORS = {
    Pyro: '#ff6b2b',
    Hydro: '#4fc3ff',
    Electro: '#b794ff',
    Cryo: '#a0e7ff',
    Anemo: '#74ffb8',
    Geo: '#ffb84f',
    Dendro: '#a5c83b',
};

const ARTIFACT_SLOTS = {
    Flower: '🌸 Hoa',
    Plume: '🪶 Lông',
    Sands: '⏳ Cát',
    Goblet: '🏺 Chén',
    Circlet: '👑 Vương Miện',
};

export default function CharacterDetailPanel({ character, onClose }) {
    if (!character) return null;

    const elementColor = ELEMENT_COLORS[character.element] || ELEMENT_COLORS.Anemo;

    // Group artifacts by set
    const artifactSets = {};
    character.artifacts.forEach(art => {
        if (art.setName) {
            artifactSets[art.setName] = (artifactSets[art.setName] || 0) + 1;
        }
    });

    const mainSets = Object.entries(artifactSets)
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1]);

    // Calculate total CV (Crit Value = Crit Rate * 2 + Crit DMG)
    const totalCV = parseFloat(character.stats.critRate) * 2 + parseFloat(character.stats.critDmg);

    return (
        <AnimatePresence>
            <motion.div
                className="detail-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="detail-panel"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ '--element-color': elementColor }}
                >
                    {/* Close Button */}
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>

                    {/* Header */}
                    <div className="detail-header">
                        {character.icon && (
                            <img src={character.icon} alt={character.name} className="detail-char-icon" />
                        )}
                        <div className="detail-char-info">
                            <h2 className="detail-char-name">{character.name}</h2>
                            <div className="detail-char-meta">
                                <span className="detail-level">Cấp {character.level}</span>
                                <span className="detail-element" style={{ background: elementColor }}>
                                    {character.element}
                                </span>
                                <span className="detail-const">C{character.constellation}</span>
                            </div>
                        </div>
                    </div>

                    {/* Weapon */}
                    {character.weapon && (
                        <div className="detail-weapon">
                            <h3 className="detail-section-title">Vũ Khí</h3>
                            <div className="weapon-detail-card">
                                {character.weapon.icon && (
                                    <img src={character.weapon.icon} alt={character.weapon.name} className="weapon-detail-icon" />
                                )}
                                <div>
                                    <div className="weapon-detail-name">{character.weapon.name}</div>
                                    <div className="weapon-detail-stats">
                                        <span>{'★'.repeat(character.weapon.rarity)}</span>
                                        <span>Cấp {character.weapon.level}</span>
                                        <span>Tinh Luyện {character.weapon.refinement}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Overall Stats */}
                    <div className="detail-stats-summary">
                        <h3 className="detail-section-title">Tổng Quan Chỉ Số</h3>
                        <div className="stats-summary-grid">
                            <div className="stat-summary-item">
                                <span className="stat-summary-label">HP</span>
                                <span className="stat-summary-value">{character.stats.hp.toLocaleString()}</span>
                            </div>
                            <div className="stat-summary-item">
                                <span className="stat-summary-label">Tấn Công</span>
                                <span className="stat-summary-value">{character.stats.atk.toLocaleString()}</span>
                            </div>
                            <div className="stat-summary-item">
                                <span className="stat-summary-label">Phòng Thủ</span>
                                <span className="stat-summary-value">{character.stats.def.toLocaleString()}</span>
                            </div>
                            <div className="stat-summary-item highlight">
                                <span className="stat-summary-label">Tỷ Lệ CHÍ MẠNG</span>
                                <span className="stat-summary-value">{character.stats.critRate}%</span>
                            </div>
                            <div className="stat-summary-item highlight">
                                <span className="stat-summary-label">ST CHÍ MẠNG</span>
                                <span className="stat-summary-value">{character.stats.critDmg}%</span>
                            </div>
                            <div className="stat-summary-item">
                                <span className="stat-summary-label">CV (Crit Value)</span>
                                <span className="stat-summary-value">{totalCV.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Artifact Sets */}
                    {mainSets.length > 0 && (
                        <div className="detail-sets">
                            <h3 className="detail-section-title">Bộ Thánh Di Vật</h3>
                            <div className="sets-list">
                                {mainSets.map(([setName, count]) => (
                                    <div key={setName} className="set-bonus-item">
                                        <span className="set-bonus-count">{count} món</span>
                                        <span className="set-bonus-name">{setName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Artifacts Detail */}
                    <div className="detail-artifacts">
                        <h3 className="detail-section-title">Chi Tiết Thánh Di Vật</h3>
                        <div className="artifacts-list">
                            {character.artifacts.map((artifact, index) => (
                                <div key={index} className="artifact-detail-card">
                                    <div className="artifact-header">
                                        <div className="artifact-icon-wrapper">
                                            {artifact.icon ? (
                                                <img src={artifact.icon} alt={artifact.name || artifact.type} className="artifact-icon-img" />
                                            ) : (
                                                <div className="artifact-slot-emoji">
                                                    {ARTIFACT_SLOTS[artifact.type]?.split(' ')[0] || '📦'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="artifact-info">
                                            <div className="artifact-name">{artifact.name || artifact.type}</div>
                                            <div className="artifact-set-name">{artifact.setName}</div>
                                            <div className="artifact-level">+{artifact.level}</div>
                                        </div>
                                    </div>

                                    {/* Main Stat */}
                                    {artifact.mainStat && (
                                        <div className="artifact-main-stat">
                                            <span className="main-stat-label">{artifact.mainStat.label}</span>
                                            <span className="main-stat-value">{artifact.mainStat.value}</span>
                                        </div>
                                    )}

                                    {/* Substats */}
                                    {artifact.substats && artifact.substats.length > 0 && (
                                        <div className="artifact-substats">
                                            {artifact.substats.map((sub, subIndex) => (
                                                <div key={subIndex} className="substat-item">
                                                    <span className="substat-label">{sub.label}</span>
                                                    <span className="substat-value">{sub.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
