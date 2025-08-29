// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 số');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUsername = (username: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('Tên đăng nhập phải có ít nhất 3 ký tự');
  }
  
  if (username.length > 20) {
    errors.push('Tên đăng nhập không được quá 20 ký tự');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} không được để trống`;
  }
  return null;
};
