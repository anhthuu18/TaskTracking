// services/authService.ts
import { SignInCredentials, AuthResponse, SignUpCredentials } from "../types/Auth";
import { API_CONFIG, buildApiUrl, getCurrentApiConfig } from "../config/api";

const request = async (url: string, options: RequestInit): Promise<AuthResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal, headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }});
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: json.message || `HTTP ${res.status}` };
    }
    return json as AuthResponse;
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return { success: false, message: isAbort ? 'Timeout request' : (err?.message || 'Network error') };
  } finally {
    clearTimeout(timeout);
  }
};

export const authService = {
  signIn: async (credentials: SignInCredentials): Promise<AuthResponse> => {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl(getCurrentApiConfig().ENDPOINTS.AUTH.SIGNIN), {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    }
    console.log("📡 Mock API gọi với:", credentials);

    // Giả lập thời gian chờ API
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock user list
        const users = [
          { username: "testuser", password: "password123", fullName: "Test User", email: "test@example.com" },
          { username: "admin", password: "Admin123", fullName: "Administrator", email: "admin@tasktracking.com" },
          { username: "demo", password: "Demo123", fullName: "Demo Account", email: "demo@example.com" },
        ];

        // Kiểm tra user
        const user = users.find(
          (u) => u.username === credentials.username && u.password === credentials.password
        );

        if (user) {
          resolve({
            success: true,
            message: "Đăng nhập thành công",
            data: {
              token: "fake-jwt-token-123456",
              user: {
                username: user.username,
                fullName: user.fullName,
                email: user.email,
              },
            },
          });
        } else {
          resolve({
            success: false,
            message: "Sai tên đăng nhập hoặc mật khẩu",
          });
        }
      }, 1000); // Giả lập API delay 1s
    });
  },

  signUp: async (credentials: SignUpCredentials): Promise<AuthResponse> => {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl(getCurrentApiConfig().ENDPOINTS.AUTH.SIGNUP), {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    }
    console.log("📡 Mock API SignUp gọi với:", credentials);

    // Giả lập thời gian chờ API
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock existing users để check duplicate
        const existingUsers = ["testuser", "admin", "demo"];

        // Kiểm tra user đã tồn tại chưa
        if (existingUsers.includes(credentials.username)) {
          resolve({
            success: false,
            message: "Tên đăng nhập đã tồn tại",
          });
          return;
        }

        // Tạo user mới thành công
        const newUser = {
          username: credentials.username,
          email: credentials.email || `${credentials.username}@example.com`,
          phone: credentials.phone,
        };

        resolve({
          success: true,
          message: "Đăng ký thành công",
          data: {
            token: `fake-jwt-token-${Date.now()}`,
            user: newUser,
          },
        });
      }, 1000); // Giả lập API delay 1s
    });
  },

  logout: async (token?: string): Promise<AuthResponse> => {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl(getCurrentApiConfig().ENDPOINTS.AUTH.LOGOUT), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    }
    // Mock logout success
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'Đăng xuất thành công' }), 500));
  },

  // Helper method để get test accounts
  getTestAccounts: () => {
    return [
      { username: "testuser", password: "password123" },
      { username: "admin", password: "Admin123" },
      { username: "demo", password: "Demo123" },
    ];
  },
};