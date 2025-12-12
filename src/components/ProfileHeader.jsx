// Premium Player Profile Header with Namecard - Tiếng Việt
import React from 'react';
import './ProfileHeader.css';

export default function ProfileHeader({ player }) {
    return (
        <div className="profile-header">
            {/* Namecard Background */}
            {/* Background (Video or Image) */}
            {player.customSettings?.customBackgroundUrl && player.customSettings?.backgroundType === 'video' ? (
                <div className="namecard-bg">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="bg-video"
                        src={player.customSettings.customBackgroundUrl}
                    />
                </div>
            ) : (
                (player.customSettings?.customBackgroundUrl || player.namecardIcon) && (
                    <div
                        className="namecard-bg"
                        style={{
                            backgroundImage: `url(${player.customSettings?.customBackgroundUrl || player.namecardIcon})`
                        }}
                    />
                )
            )}

            {/* Content Overlay */}
            <div className="profile-content">
                <div className="profile-main">
                    <div className="profile-avatar">
                        <div className="avatar-ring"></div>
                        <div className="avatar-inner">
                            {player.profilePicture ? (
                                <img
                                    src={player.profilePicture}
                                    alt={player.nickname}
                                    className="avatar-img"
                                />
                            ) : (
                                <span className="avatar-level">Cấp {player.level}</span>
                            )}
                        </div>
                    </div>

                    <div className="profile-info">
                        <h1 className="profile-nickname">{player.nickname}</h1>
                        <p className="profile-uid">UID: {player.uid}</p>

                        {player.signature && (
                            <div className="profile-signature">
                                <span className="signature-icon">✦</span>
                                "{player.signature}"
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat-card">
                        <div className="stat-icon">🏆</div>
                        <div className="stat-content">
                            <span className="stat-label">Cấp Mạo Hiểm</span>
                            <span className="stat-value">{player.level}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🌎</div>
                        <div className="stat-content">
                            <span className="stat-label">Cấp Thế Giới</span>
                            <span className="stat-value">{player.worldLevel}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-content">
                            <span className="stat-label">Thành Tựu</span>
                            <span className="stat-value">{player.achievementCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
