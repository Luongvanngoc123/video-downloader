// Enhanced Enka API Service - Frontend Client
import axios from 'axios';

const API_BASE = '/api';
const FIXED_UID = '827081602';

/**
 * Fetch complete profile data for the fixed UID from backend
 */
export async function fetchFixedProfile() {
    try {
        console.log(`Fetching profile for UID ${FIXED_UID} from backend...`);

        const response = await axios.get(`${API_BASE}/profile/${FIXED_UID}`, {
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
            }
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            if (status === 404) throw new Error('UID_NOT_FOUND');
            if (status === 424) throw new Error('PROFILE_PRIVATE');
            if (status === 429) throw new Error('RATE_LIMITED');
            if (status >= 500) throw new Error('API_MAINTENANCE');
        } else if (error.request) {
            throw new Error('NETWORK_ERROR');
        }
        throw new Error('UNKNOWN_ERROR');
    }
}

/**
 * Get error message in Vietnamese
 */
export function getErrorMessage(errorCode) {
    const messages = {
        UID_NOT_FOUND: 'Không tìm thấy UID này. Vui lòng kiểm tra lại.',
        PROFILE_PRIVATE: 'Tài khoản đang ẩn showcase. Hãy mở showcase trong game.',
        RATE_LIMITED: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        API_MAINTENANCE: 'Enka Network đang bảo trì. Vui lòng thử lại sau.',
        NETWORK_ERROR: 'Lỗi kết nối. Kiểm tra internet của bạn.',
        UNKNOWN_ERROR: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
    };
    return messages[errorCode] || messages.UNKNOWN_ERROR;
}
