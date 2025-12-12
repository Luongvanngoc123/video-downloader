// Error Message Component
import React from 'react';
import './ErrorMessage.css';

export default function ErrorMessage({ message, onRetry }) {
    return (
        <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3 className="error-title">Có lỗi xảy ra</h3>
            <p className="error-message">{message}</p>
            {onRetry && (
                <button className="retry-button" onClick={onRetry}>
                    Thử lại
                </button>
            )}
        </div>
    );
}
