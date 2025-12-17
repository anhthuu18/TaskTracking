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
        GOOGLE: '/auth/google',
      },
      USER: {
        PROFILE: '/auth/profile',
        UPDATE: '/user/update',
      },

      PROJECT: {
        CREATE: '/projects/create-project',
        LIST_ALL: '/projects/list-all',
        LIST_BY_WORKSPACE: '/projects/list-by-workspace',
        GET_DETAILS: '/projects',
        UPDATE: '/projects/update-project',
        DELETE: '/projects/delete-project',
        RESTORE: '/projects/restore-project',
        LIST_DELETED: '/projects/list-deleted',
        GET_MEMBERS: '/projects/get-members',
        ADD_MEMBER: '/projects/add-member',
        INVITE_MEMBER: '/projects/invite-member',
        REMOVE_MEMBER: '/projects/remove-member',
        UPDATE_MEMBER_ROLE: '/projects/update-member-role',
        CREATE_ROLE: '/projects/create-role',
        STAR_PROJECT: '/projects/star',
        UPDATE_LAST_OPENED: '/projects/update-last-opened',
      },
      WORKSPACE: {
        CREATE: '/workspace/create-workspace',
        LIST_ALL: '/workspace/list-all',
        LIST_PERSONAL: '/workspace/list-personal',
        LIST_GROUP: '/workspace/list-group',
        GET_DETAILS: '/workspace/get-details',
        DELETE: '/workspace/delete-workspace',
        RESTORE: '/workspace/restore-workspace',
        LIST_DELETED: '/workspace/list-deleted',
        GET_MEMBERS: '/workspace',
        INVITE_MEMBER: '/workspace/invite-member',
      },
      NOTIFICATION: {
        GET_ALL: '/notification',
        ACCEPT: '/notification/accept',
        DECLINE: '/notification/decline',
        PROJECT_INVITE: '/notification/project-invite',
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
        GOOGLE: '/auth/google', // Android
        GOOGLE_WEB: '/auth/google/web', // Web admin
      },
      USER: {
        PROFILE: '/auth/profile',
        UPDATE: '/user/update',
      },
      WORKSPACE: {
        CREATE: '/workspace/create-workspace',
        LIST_ALL: '/workspace/list-all',
        LIST_PERSONAL: '/workspace/list-personal',
        LIST_GROUP: '/workspace/list-group',
        GET_DETAILS: '/workspace/get-details',
        DELETE: '/workspace/delete-workspace',
        RESTORE: '/workspace/restore-workspace',
        LIST_DELETED: '/workspace/list-deleted',
        GET_MEMBERS: '/workspace',
        INVITE_MEMBER: '/workspace/invite-member',
      },
      NOTIFICATION: {
        GET_ALL: '/notification',
        ACCEPT: '/notification/accept',
        DECLINE: '/notification/decline',
        PROJECT_INVITE: '/notification/project-invite',
      },
      PROJECT: {
        CREATE: '/projects/create-project',
        LIST_ALL: '/projects/list-all',
        LIST_BY_WORKSPACE: '/projects/list-by-workspace',
        GET_DETAILS: '/projects/get-details',
        UPDATE: '/projects/update-project',
        DELETE: '/projects/delete-project',
        RESTORE: '/projects/restore-project',
        LIST_DELETED: '/projects/list-deleted',
        GET_MEMBERS: '/projects/get-members',
        ADD_MEMBER: '/projects/add-member',
        INVITE_MEMBER: '/projects/:id/invite-member',
        REMOVE_MEMBER: '/projects/remove-member',
        UPDATE_MEMBER_ROLE: '/projects/update-member-role',
        CREATE_ROLE: '/projects/create-role',
        STAR_PROJECT: '/projects/:id/star',
        UPDATE_LAST_OPENED: '/projects/:id/log-access',
      },
      TASK: {
        CREATE: '/tasks',
        GET_BY_PROJECT: '/tasks/project',
        GET_BY_ID: '/tasks',
        UPDATE: '/tasks',
        DELETE: '/tasks',
        GET_ASSIGNEES: '/tasks/project',
        GET_BY_WORKSPACE: '/tasks/workspace',
      },
    },
  },

  // Request timeout (ms)
  TIMEOUT: 30000, // Increased to 30 seconds for slower networks

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
