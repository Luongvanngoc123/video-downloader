// Character Card Component
import React from 'react';
import { getCharacterElement, getCharacterName } from '../api/dataParser';
import { ELEMENT_COLORS } from '../utils/constants';
import './CharacterCard.css';

export default function CharacterCard({ character }) {
    const element = getCharacterElement(character.avatarId);
    const name = getCharacterName(character.avatarId);
    const elementColor = ELEMENT_COLORS[element] || '#fff';

    // Get main artifact sets
    const artifactSets = getArtifactSets(character.artifacts);

    return (
        <div className="character-card" style={{ '--element-color': elementColor }}>
            <div className="character-header">
                <div className="character-level-badge">Lv. {character.level}</div>
                <div className="element-badge" style={{ background: elementColor }}>
                    {element}
                </div>
            </div>

            <div className="character-avatar">
                <div className="character-name">{name}</div>
                <div className="character-constellation">C{character.constellation}</div>
            </div>

            {character.weapon && (
                <div className="weapon-info">
                    <div className="weapon-header">
                        <span className="weapon-name">⚔️ Vũ khí</span>
                        <span className="weapon-rarity">{'★'.repeat(character.weapon.rarity)}</span>
                    </div>
                    <div className="weapon-details">
                        <span className="weapon-level">Lv. {character.weapon.level}</span>
                        <span className="weapon-refine">R{character.weapon.refinement}</span>
                    </div>
                </div>
            )}

            <div className="character-stats">
                <div className="stat-row">
                    <span className="stat-name">CRIT Rate</span>
                    <span className="stat-val">{character.stats.critRate}%</span>
                </div>
                <div className="stat-row">
                    <span className="stat-name">CRIT DMG</span>
                    <span className="stat-val">{character.stats.critDmg}%</span>
                </div>
                <div className="stat-row">
                    <span className="stat-name">ATK</span>
                    <span className="stat-val">{character.stats.atk}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-name">EM</span>
                    <span className="stat-val">{character.stats.em}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-name">ER</span>
                    <span className="stat-val">{character.stats.er}%</span>
                </div>
            </div>

            {artifactSets.length > 0 && (
                <div className="artifact-sets">
                    <div className="artifact-label">Artifact Sets:</div>
                    {artifactSets.map((set, idx) => (
                        <div key={idx} className="artifact-set-badge">
                            {set.count}pc {set.name}
                        </div>
                    ))}
                </div>
            )}

            {character.friendship > 0 && (
                <div className="friendship-badge">
                    ❤️ Friendship {character.friendship}
                </div>
            )}
        </div>
    );
}

// Helper function to count artifact sets
function getArtifactSets(artifacts) {
    const setCounts = {};

    artifacts.forEach(artifact => {
        if (artifact.name) {
            setCounts[artifact.name] = (setCounts[artifact.name] || 0) + 1;
        }
    });

    return Object.entries(setCounts)
        .filter(([_, count]) => count >= 2)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}
