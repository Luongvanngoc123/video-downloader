// Enka Network API Client
import axios from 'axios';
import { saveToCache, getFromCache } from '../utils/cache';

// Use Vite proxy in development, direct API in production
const API_BASE = import.meta.env.DEV ? '/api' : 'https://enka.network/api';

/**
 * Fetch player data from Enka Network API
 * @param {string} uid - Player UID
 * @returns {Promise<Object>} Player data
 */
export async function fetchPlayerData(uid) {
    // Check cache first
    const cached = getFromCache(uid);
    if (cached) {
        console.log('Returning cached data for UID:', uid);
        return cached;
    }

    try {
        const response = await axios.get(`${API_BASE}/uid/${uid}`, {
            timeout: 15000, // 15 second timeout
        });

        // Cache the response
        saveToCache(uid, response.data);

        return response.data;
    } catch (error) {
        // Handle different error types
        if (error.response) {
            const status = error.response.status;

            if (status === 404) {
                throw new Error('UID_NOT_FOUND');
            } else if (status === 424) {
                throw new Error('PROFILE_PRIVATE');
            } else if (status === 429) {
                throw new Error('RATE_LIMITED');
            } else if (status >= 500) {
                throw new Error('API_MAINTENANCE');
            } else {
                throw new Error('API_ERROR');
            }
        } else if (error.request) {
            throw new Error('NETWORK_ERROR');
        } else {
            throw new Error('UNKNOWN_ERROR');
        }
    }
}

/**
 * Get error message for display
 */
export function getErrorMessage(errorCode) {
    const messages = {
        UID_NOT_FOUND: 'Không tìm thấy UID này. Vui lòng kiểm tra lại.',
        PROFILE_PRIVATE: 'Tài khoản này đang ẩn showcase. Hãy yêu cầu người chơi mở showcase trong game.',
        RATE_LIMITED: 'Quá nhiều yêu cầu. Vui lòng thử lại sau vài giây.',
        API_MAINTENANCE: 'Enka Network API đang bảo trì. Vui lòng thử lại sau.',
        NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet của bạn.',
        API_ERROR: 'Có lỗi xảy ra với API. Vui lòng thử lại sau.',
        UNKNOWN_ERROR: 'Có lỗi không xác định xảy ra. Vui lòng thử lại.',
    };

    return messages[errorCode] || messages.UNKNOWN_ERROR;
}
