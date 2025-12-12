// Loading Spinner Component
import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ message = 'Đang tải...' }) {
    return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-message">{message}</p>
        </div>
    );
}
