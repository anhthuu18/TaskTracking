// services/authService.ts
import { SignInCredentials, AuthResponse, SignUpCredentials } from "../types/Auth";

export const authService = {
  signIn: async (credentials: SignInCredentials): Promise<AuthResponse> => {
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
    console.log("📡 Mock API SignUp gọi với:", credentials.username);

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
          fullName: credentials.fullName || credentials.username,
          email: credentials.email || `${credentials.username}@example.com`,
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

  // Helper method để get test accounts
  getTestAccounts: () => {
    return [
      { username: "testuser", password: "password123" },
      { username: "admin", password: "Admin123" },
      { username: "demo", password: "Demo123" },
    ];
  },
};