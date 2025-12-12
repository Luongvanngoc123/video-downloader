import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchFixedProfile, getErrorMessage } from '../services/enkaService';
import ProfileHeader from '../components/ProfileHeader';
import CharacterShowcase from '../components/CharacterShowcase';
import CharacterDetailPanel from '../components/CharacterDetailPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ThreeBackground from '../components/ThreeBackground';

export default function Home() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchFixedProfile();
            setProfileData(data);
        } catch (err) {
            const errorMessage = getErrorMessage(err.message);
            setError(errorMessage);
            console.error('Profile load error:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="loading-wrapper">
                <LoadingSpinner message={'Đang tải hồ sơ...'} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-wrapper">
                <ErrorMessage message={error} onRetry={loadProfile} />
            </div>
        );
    }

    if (!profileData) return null;

    return (
        <div className="home-page">
            <ThreeBackground />

            <motion.header
                className="app-header"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Header content removed as requested */}
            </motion.header>

            <main className="app-main">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <ProfileHeader player={profileData.player} />
                    </motion.div>

                    <section className="characters-section">
                        <motion.h2
                            className="section-title"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                        >
                            <span className="title-decoration">✦</span>
                            Giới Thiệu Nhân Vật
                            <span className="title-decoration">✦</span>
                        </motion.h2>

                        {profileData.characters.length > 0 ? (
                            <div className="characters-grid">
                                <AnimatePresence>
                                    {profileData.characters.map((character, index) => (
                                        <motion.div
                                            key={character.id}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.5,
                                                delay: 0.7 + index * 0.1,
                                            }}
                                            whileHover={{ scale: 1.03 }}
                                            onClick={() => setSelectedCharacter(character)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <CharacterShowcase character={character} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="no-characters">
                                <p>Không có nhân vật nào trong showcase</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {selectedCharacter && (
                <CharacterDetailPanel
                    character={selectedCharacter}
                    onClose={() => setSelectedCharacter(null)}
                />
            )}
        </div>
    );
}
