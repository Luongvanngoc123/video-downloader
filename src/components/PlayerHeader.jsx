// Player Header Component
import React from 'react';
import './PlayerHeader.css';

export default function PlayerHeader({ player }) {
    return (
        <div className="player-header">
            <div className="player-card">
                <div className="player-background"></div>
                <div className="player-info">
                    <div className="player-main">
                        <h1 className="player-nickname">{player.nickname}</h1>
                        <p className="player-uid">UID: {player.uid}</p>
                    </div>
                    <div className="player-stats">
                        <div className="stat-item">
                            <span className="stat-label">Adventure Rank</span>
                            <span className="stat-value">{player.level}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">World Level</span>
                            <span className="stat-value">{player.worldLevel}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Thành tựu</span>
                            <span className="stat-value">{player.achievementCount}</span>
                        </div>
                    </div>
                    {player.signature && (
                        <div className="player-signature">
                            <p>"{player.signature}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
