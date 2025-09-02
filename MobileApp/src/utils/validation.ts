import { Strings } from '../constants/Strings';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
  phone?: string;
}

// Username validation
export const validateUsername = (username: string): ValidationResult => {
  if (!username || username.trim() === '') {
    return {
      isValid: false,
      error: Strings.errorUsernameRequired,
    };
  }

  if (username.length < 3) {
    return {
      isValid: false,
      error: Strings.errorUsernameMinLength,
    };
  }

  // Check if username contains only letters, numbers, and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error: Strings.errorUsernameInvalid,
    };
  }

  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return {
      isValid: false,
      error: Strings.errorPasswordRequired,
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: Strings.errorPasswordMinLength,
    };
  }

  // Check for at least one uppercase letter, one lowercase letter, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
  if (!passwordRegex.test(password)) {
    return {
      isValid: false,
      error: Strings.errorPasswordWeak,
    };
  }

  return { isValid: true };
};

// Confirm password validation
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return {
      isValid: false,
      error: Strings.errorConfirmPasswordRequired,
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: Strings.errorPasswordMismatch,
    };
  }

  return { isValid: true };
};

// Email validation (if needed for future use)
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: Strings.errorRequired,
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: Strings.errorEmailInvalid,
    };
  }

  return { isValid: true };
};

// Phone number validation for Vietnamese phone numbers
export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return {
      isValid: false,
      error: Strings.errorRequired,
    };
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const vietnamesePhoneRegex = /^(84|0)?(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;

  if (!vietnamesePhoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: Strings.errorPhoneInvalid,
    };
  }

  return { isValid: true };
};

// Validate all signup fields
export const validateSignUpForm = (
  username: string,
  password: string,
  confirmPassword: string,
  email?: string,
  phone?: string
): { isValid: boolean; errors: FormErrors } => {
  const errors: FormErrors = {};
  let isValid = true;

  // Validate username
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.error;
    isValid = false;
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
    isValid = false;
  }

  // Validate confirm password
  const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.error;
    isValid = false;
  }

  if (email !== undefined) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
      isValid = false;
    }
  }

  if (phone !== undefined) {
    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Validate signin fields
export const validateSignInForm = (
  username: string,
  password: string
): { isValid: boolean; errors: FormErrors } => {
  const errors: FormErrors = {};
  let isValid = true;

  // Validate username (basic required check for signin)
  if (!username || username.trim() === '') {
    errors.username = Strings.errorUsernameRequired;
    isValid = false;
  }

  // Validate password (basic required check for signin)
  if (!password || password.trim() === '') {
    errors.password = Strings.errorPasswordRequired;
    isValid = false;
  }

  return { isValid, errors };
};

// Helper function to check if a single field has error
export const hasFieldError = (errors: FormErrors, field: keyof FormErrors): boolean => {
  return !!errors[field];
};

// Helper function to get field error message
export const getFieldError = (errors: FormErrors, field: keyof FormErrors): string => {
  return errors[field] || '';
};
