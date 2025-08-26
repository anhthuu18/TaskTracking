// Mock data for authentication testing

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
  };
  error?: string;
}

// Mock users database
export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    username: 'admin',
    email: 'admin@tasktracking.com',
    fullName: 'Administrator',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock credentials (username: password)
export const MOCK_CREDENTIALS = {
  'testuser': 'password123',
  'admin': 'Admin123',
  'demo': 'Demo123',
};

// Mock responses
export const MOCK_RESPONSES = {
  SIGNIN_SUCCESS: (user: User): AuthResponse => ({
    success: true,
    message: 'Đăng nhập thành công',
    data: {
      user,
      token: `mock_token_${user.id}_${Date.now()}`,
      refreshToken: `mock_refresh_${user.id}_${Date.now()}`,
    },
  }),

  SIGNIN_INVALID_CREDENTIALS: (): AuthResponse => ({
    success: false,
    message: 'Tên đăng nhập hoặc mật khẩu không đúng',
    error: 'INVALID_CREDENTIALS',
  }),

  SIGNUP_SUCCESS: (userData: Partial<User>): AuthResponse => {
    const newUser: User = {
      id: `${Date.now()}`,
      username: userData.username || '',
      email: userData.email || `${userData.username}@example.com`,
      fullName: userData.fullName || userData.username,
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: newUser,
        token: `mock_token_${newUser.id}_${Date.now()}`,
        refreshToken: `mock_refresh_${newUser.id}_${Date.now()}`,
      },
    };
  },

  SIGNUP_USER_EXISTS: (): AuthResponse => ({
    success: false,
    message: 'Tên đăng nhập đã tồn tại',
    error: 'USER_EXISTS',
  }),

  NETWORK_ERROR: (): AuthResponse => ({
    success: false,
    message: 'Lỗi kết nối mạng',
    error: 'NETWORK_ERROR',
  }),

  SERVER_ERROR: (): AuthResponse => ({
    success: false,
    message: 'Lỗi máy chủ',
    error: 'SERVER_ERROR',
  }),
};

// Helper function để check if user exists
export const findUserByUsername = (username: string): User | undefined => {
  return MOCK_USERS.find(user => user.username === username);
};

// Helper function để validate credentials
export const validateCredentials = (username: string, password: string): boolean => {
  const expectedPassword = MOCK_CREDENTIALS[username as keyof typeof MOCK_CREDENTIALS];
  return expectedPassword === password;
};
