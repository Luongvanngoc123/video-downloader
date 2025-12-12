// Premium Character Showcase Component with Atropos 3D
import React, { useEffect, useRef } from 'react';
import Atropos from 'atropos/react';
import 'atropos/css';
import './CharacterShowcase.css';

const ELEMENT_COLORS = {
    Pyro: { primary: '#ff6b2b', secondary: '#ff9f6b' },
    Hydro: { primary: '#4fc3ff', secondary: '#7dd4ff' },
    Electro: { primary: '#b794ff', secondary: '#d0b3ff' },
    Cryo: { primary: '#a0e7ff', secondary: '#c5f1ff' },
    Anemo: { primary: '#74ffb8', secondary: '#a3ffd0' },
    Geo: { primary: '#ffb84f', secondary: '#ffd085' },
    Dendro: { primary: '#a5c83b', secondary: '#c0d973' },
};

export default function CharacterShowcase({ character }) {
    const elementColors = ELEMENT_COLORS[character.element] || ELEMENT_COLORS.Anemo;

    // Get artifact sets (group by set name)
    const artifactSets = {};
    character.artifacts.forEach(art => {
        if (art.setName) {
            artifactSets[art.setName] = (artifactSets[art.setName] || 0) + 1;
        }
    });

    const mainSets = Object.entries(artifactSets)
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1]);

    return (
        <Atropos
            className="atropos-character"
            activeOffset={40}
            shadowScale={1.05}
            highlight={false}
        >
            <div
                className="character-showcase"
                style={{
                    '--element-primary': elementColors.primary,
                    '--element-secondary': elementColors.secondary,
                }}
            >
                {/* Background Splash Art */}
                {character.splash && (
                    <div
                        className="character-splash-bg"
                        data-atropos-offset="-5"
                        style={{ backgroundImage: `url(${character.splash})` }}
                    />
                )}

                {/* Content Overlay */}
                <div className="character-content" data-atropos-offset="0">
                    {/* Header */}
                    <div className="character-header">
                        <div className="character-icon-wrapper" data-atropos-offset="5">
                            {character.icon && (
                                <img src={character.icon} alt={character.name} className="character-icon" />
                            )}
                        </div>

                        <div className="character-info">
                            <h3 className="character-name" data-atropos-offset="3">{character.name}</h3>
                            <div className="character-meta">
                                <span className="character-level" data-atropos-offset="2">Cấp {character.level}</span>
                                <span className="character-element" data-atropos-offset="2" style={{ background: elementColors.primary }}>
                                    {character.element}
                                </span>
                                <span className="character-const" data-atropos-offset="2">C{character.constellation}</span>
                            </div>
                        </div>
                    </div>

                    {/* Weapon Section */}
                    {character.weapon && (
                        <div className="weapon-section" data-atropos-offset="3">
                            <div className="weapon-header">
                                {character.weapon.icon && (
                                    <img src={character.weapon.icon} alt={character.weapon.name} className="weapon-icon" />
                                )}
                                <div className="weapon-info">
                                    <h4 className="weapon-name">{character.weapon.name}</h4>
                                    <div className="weapon-details">
                                        <span className="weapon-rarity">{'★'.repeat(character.weapon.rarity)}</span>
                                        <span className="weapon-level">Cấp {character.weapon.level}</span>
                                        <span className="weapon-refine">Tinh Luyện {character.weapon.refinement}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="stats-grid" data-atropos-offset="2">
                        <div className="stat-item">
                            <span className="stat-label">HP</span>
                            <span className="stat-value">{character.stats.hp.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Tấn Công</span>
                            <span className="stat-value">{character.stats.atk.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Phòng Thủ</span>
                            <span className="stat-value">{character.stats.def.toLocaleString()}</span>
                        </div>
                        <div className="stat-item highlight">
                            <span className="stat-label">Tỷ Lệ CHÍ MẠNG</span>
                            <span className="stat-value">{character.stats.critRate}%</span>
                        </div>
                        <div className="stat-item highlight">
                            <span className="stat-label">ST CHÍ MẠNG</span>
                            <span className="stat-value">{character.stats.critDmg}%</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Tinh Thông Nguyên Tố</span>
                            <span className="stat-value">{character.stats.em}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Nạp Năng Lượng</span>
                            <span className="stat-value">{character.stats.er}%</span>
                        </div>
                    </div>

                    {/* Artifact Sets */}
                    {mainSets.length > 0 && (
                        <div className="artifact-sets" data-atropos-offset="4">
                            {mainSets.map(([setName, count]) => (
                                <div key={setName} className="artifact-set-badge">
                                    {count} món {setName}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Friendship */}
                    {character.friendship > 0 && (
                        <div className="friendship-level" data-atropos-offset="3">
                            ❤️ Độ Thân Mật Cấp {character.friendship}
                        </div>
                    )}
                </div>
            </div>
        </Atropos>
    );
}
