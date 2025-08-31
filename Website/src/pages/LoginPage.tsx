import React, { useState } from 'react';
import { EyeOutlined, EyeInvisibleOutlined, UserOutlined, LockOutlined, MobileOutlined, DownloadOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, BulbOutlined, QrcodeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import googleIcon from '../assets/images/gg.png';
import './LoginPage.scss';

interface LoginFormData {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement actual login logic here
      console.log('Login attempt:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Handle successful login
      console.log('Login successful');
      
    } catch (error) {
      console.error('Login failed:', error);
      // TODO: Handle login error
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google Sign In
    console.log('Google Sign In clicked');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-layout">
        {/* Left Column - Information/Advertisement */}
        <div className="login-info-section">
          <div className="info-header">
            <h2 className="info-title">SmartReminder</h2>
            <p className="info-subtitle">Ứng dụng nhắc lịch thông minh</p>
          </div>
          
          <div className="info-content">
            <h1 className="info-headline">
              Nâng cao hiệu suất làm việc của bạn lên mức tối đa!
            </h1>
            <p className="info-description">
              Quản lý thời gian hiệu quả với SmartReminder - ứng dụng nhắc lịch thông minh 
              giúp bạn không bao giờ bỏ lỡ những sự kiện quan trọng.
            </p>
            
            {/* Feature highlights */}
            <div className="feature-highlights">
              <div className="feature-item">
                <CheckCircleOutlined className="feature-icon" />
                <span>Nhắc lịch thông minh</span>
              </div>
              <div className="feature-item">
                <ClockCircleOutlined className="feature-icon" />
                <span>Lập kế hoạch dễ dàng</span>
              </div>
              <div className="feature-item">
                <SyncOutlined className="feature-icon" />
                <span>Đồng bộ đa thiết bị</span>
              </div>
              <div className="feature-item">
                <BulbOutlined className="feature-icon" />
                <span>AI gợi ý thông minh</span>
              </div>
            </div>
          </div>

          <div className="mobile-app-section">
            <h3 className="mobile-app-title">
              <MobileOutlined className="mobile-icon" />
              Tải ứng dụng di động
            </h3>
            <div className="download-buttons">
              <button className="download-btn download-btn-primary">
                <DownloadOutlined />
                Dành cho IOS
              </button>
              <button className="download-btn download-btn-secondary">
                <DownloadOutlined />
                Dành cho Android
              </button>
            </div>
          </div>

          <div className="info-footer">
            <p className="copyright">© 2024 SmartReminder | Mọi quyền được bảo lưu</p>
          </div>

          {/* Decorative elements */}
          <div className="info-decoration">
            <div className="decoration-circle info-circle-1"></div>
            <div className="decoration-circle info-circle-2"></div>
            <div className="decoration-circle info-circle-3"></div> 
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className="login-form-section">
          <div className="form-header"> 
            <h2 className="form-title">SmartReminder | Login</h2>
          </div>

          <div className="form-container">
            <div className="welcome-text">
              <h1 className="welcome-title">Welcome back, bbi!</h1>
              <p className="welcome-subtitle">Đăng nhập vào hệ thống quản lý Admin</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <UserOutlined className="input-icon" />
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  name="username"
                  className={`form-input ${errors.username ? 'form-input-error' : ''}`}
                  placeholder="Nhập tên đăng nhập"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />  
                {errors.username && (
                  <span className="error-message">{errors.username}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <LockOutlined className="input-icon" />
                  Mật khẩu
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input password-input ${errors.password ? 'form-input-error' : ''}`}
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input type="checkbox" className="checkbox-input" />
                  <span className="checkbox-custom"></span>
                  Ghi nhớ đăng nhập
                </label>
                <a href="#" className="forgot-password-link">
                  Quên mật khẩu?
                </a>
              </div>

              <button
                type="submit"
                className={`btn btn-primary login-btn ${isLoading ? 'btn-loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="login-divider">
              <span className="divider-text">hoặc</span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              className="btn btn-google google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <img src={googleIcon} alt="Google" className="google-icon" />
              Đăng nhập với Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
