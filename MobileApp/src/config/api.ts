// API Configuration
// Dễ dàng switch giữa mock API và real API

export const API_CONFIG = {
  // Set USE_MOCK_API = false khi muốn sử dụng real API
  USE_MOCK_API: false,
  
  // Mock API endpoints (sẽ được simulate bằng setTimeout)
  MOCK_API: {
    BASE_URL: 'https://mock-api.tasktracking.com/api/v1',
    ENDPOINTS: {
      AUTH: {
        SIGNIN: '/auth/signin',
        SIGNUP: '/auth/signup',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
      },
      USER: {
        PROFILE: '/user/profile',
        UPDATE: '/user/update',
      },
    },
  },
  
  // Real API endpoints (sẽ được sử dụng khi USE_MOCK_API = false)
  REAL_API: {
    // Gợi ý: Android emulator dùng 10.0.2.2, iOS simulator dùng localhost
    BASE_URL: 'http://10.0.2.2:3000',
    ENDPOINTS: {
      AUTH: {
        SIGNIN: '/auth/login',
        SIGNUP: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
      },
      USER: {
        PROFILE: '/user/profile',
        UPDATE: '/user/update',
      },
    },
  },
  
  // Request timeout (ms)
  TIMEOUT: 10000,
  
  // Mock API delay để simulate network latency
  MOCK_DELAY: 1500, // 1.5 seconds
};

// Helper function để lấy API config hiện tại
export const getCurrentApiConfig = () => {
  return API_CONFIG.USE_MOCK_API ? API_CONFIG.MOCK_API : API_CONFIG.REAL_API;
};

// Helper function để build full URL
export const buildApiUrl = (endpoint: string) => {
  const config = getCurrentApiConfig();
  return `${config.BASE_URL}${endpoint}`;
};
