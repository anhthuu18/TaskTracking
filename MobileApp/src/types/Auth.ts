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
      id?: string | number;
      username: string;
      email?: string;
      phone?: string;
      fullName?: string;
      dateCreated?: string;
    };
  };
}

export interface SignUpCredentials {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
}