import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

export default function Admin() {
    const [settings, setSettings] = useState({
        customAvatarUrl: '',
        customBackgroundUrl: '',
        backgroundType: 'image'
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('/api/admin/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to fetch settings');
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post('/api/admin/settings', settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Đã lưu cài đặt thành công!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Lỗi khi lưu cài đặt.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} className="logout-btn">Đăng Xuất</button>
            </div>

            <div className="admin-content">
                {message && <div className="success-msg">{message}</div>}

                <div className="setting-group">
                    <h3>Custom Avatar</h3>
                    <p>Nhập URL ảnh để thay thế Avatar mặc định (để trống nếu muốn dùng mặc định)</p>
                    <input
                        type="text"
                        placeholder="https://example.com/avatar.png"
                        value={settings.customAvatarUrl}
                        onChange={(e) => setSettings({ ...settings, customAvatarUrl: e.target.value })}
                    />
                </div>

                <div className="setting-group">
                    <h3>Custom Header Background</h3>
                    <p>Nhập URL ảnh hoặc video để thay thế Namecard nền</p>
                    <input
                        type="text"
                        placeholder="https://example.com/bg.mp4"
                        value={settings.customBackgroundUrl}
                        onChange={(e) => setSettings({ ...settings, customBackgroundUrl: e.target.value })}
                    />

                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                name="bgType"
                                value="image"
                                checked={settings.backgroundType === 'image'}
                                onChange={(e) => setSettings({ ...settings, backgroundType: e.target.value })}
                            /> Image
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="bgType"
                                value="video"
                                checked={settings.backgroundType === 'video'}
                                onChange={(e) => setSettings({ ...settings, backgroundType: e.target.value })}
                            /> Video
                        </label>
                    </div>
                </div>

                <button onClick={handleSave} className="save-btn">Lưu Thay Đổi</button>
            </div>
        </div>
    );
}
