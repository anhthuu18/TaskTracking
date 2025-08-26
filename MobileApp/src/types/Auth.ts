// Authentication types

export interface SignInCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      username: string;
      fullName?: string;
      email?: string;
    };
  };
}

export interface SignUpCredentials {
  username: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
  email?: string;
}