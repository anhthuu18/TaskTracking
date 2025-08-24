# Mock API Authentication Guide

## 📱 **Mock API đã được setup cho Authentication**

Mock API được thiết kế để simulate backend authentication mà không cần thực sự có backend server. Khi bạn hoàn thành backend, chỉ cần thay đổi cấu hình để switch sang Real API.

## 🔧 **Cấu hình**

### Switch từ Mock API sang Real API:
```typescript
// File: src/config/api.ts
export const API_CONFIG = {
  USE_MOCK_API: false, // Đổi thành false để sử dụng Real API
  // ... rest of config
};
```

### Đổi Real API URL:
```typescript
// File: src/config/api.ts
REAL_API: {
  BASE_URL: 'https://your-backend-url.com/api/v1', // Thay URL này
  // ... endpoints remain same
}
```

## 🧪 **Mock Data để test**

### Test Credentials (Mock API):
```
Username: testuser | Password: password123
Username: admin    | Password: Admin123  
Username: demo     | Password: Demo123
```

### Tính năng Mock API:
- ✅ **Realistic delays**: 1.5s simulate network latency
- ✅ **Error simulation**: 5% chance random network errors  
- ✅ **Proper validation**: Check username exists, password match
- ✅ **Success responses**: Return user data + tokens
- ✅ **Vietnamese messages**: Error messages bằng tiếng Việt

## 📊 **API Response Format**

### Success Response:
```typescript
{
  success: true,
  message: "Đăng nhập thành công",
  data: {
    user: {
      id: "1",
      username: "testuser", 
      email: "test@example.com",
      fullName: "Test User",
      // ...
    },
    token: "mock_token_1_1234567890",
    refreshToken: "mock_refresh_1_1234567890"
  }
}
```

### Error Response:
```typescript
{
  success: false,
  message: "Tên đăng nhập hoặc mật khẩu không đúng",
  error: "INVALID_CREDENTIALS"
}
```

## 🔄 **Workflow khi chuyển sang Real API**

### Bước 1: Hoàn thành Backend API
- Tạo endpoints: `/auth/signin`, `/auth/signup`
- Response format giống như mock (để frontend không cần thay đổi)

### Bước 2: Update Configuration  
```typescript
// src/config/api.ts
export const API_CONFIG = {
  USE_MOCK_API: false, // Switch to Real API
  REAL_API: {
    BASE_URL: 'https://your-production-api.com/api/v1',
    // ...
  }
};
```

### Bước 3: Test & Deploy
- Không cần thay đổi gì ở UI components
- AuthService sẽ tự động sử dụng Real API
- Test đầy đủ trước khi release

## 🎯 **Benefits của approach này**

- ✅ **Parallel Development**: Frontend có thể develop không phụ thuộc Backend
- ✅ **Realistic Testing**: Mock API simulate real scenarios
- ✅ **Easy Switch**: Chỉ 1 config change để chuyển
- ✅ **No Code Changes**: UI components không cần sửa
- ✅ **Consistent Interface**: Same API contract

## 📝 **Current Features**

### SignIn Screen:
- Form validation
- Mock API call với loading state
- Success: Alert + navigate to TaskList
- Error: Show error message
- Mock users: `testuser`, `admin`, `demo`

### SignUp Screen:  
- Form validation (password strength, confirm match)
- Mock API call với loading state
- Success: Alert + navigate to SignIn
- Error: Show error message (user exists, etc.)
- Auto-generate email for demo

## 🔍 **Debug & Monitoring**

Check console logs để see API calls:
```
🔄 Mock API: Simulating signin request... testuser
✅ Mock API: Signin successful
```

Mock API có 5% chance random errors để test error handling.

---

**🚀 Happy Coding! Chỉ cần thay config khi backend ready!**
