# SmartReminder Admin - Frontend

Hệ thống quản lý Admin cho ứng dụng di động SmartReminder - ứng dụng nhắc lịch thông minh. Được xây dựng với React + TypeScript và sử dụng bảng màu thiết kế nhất quán.

## 🚀 Tính năng

- **Giao diện đăng nhập Admin** với animation và responsive design
- **Bảng màu nhất quán** với CSS variables và utility classes
- **Form validation** với error handling
- **Loading states** và user feedback
- **Dark mode support** tự động
- **Responsive design** cho mọi thiết bị
- **Admin-only access** - Chỉ dành cho quản trị viên

## 🛠️ Công nghệ sử dụng

- **React 18** với TypeScript
- **Vite** - Build tool nhanh
- **SASS/SCSS** - CSS preprocessor
- **Ant Design Icons** - Icon library
- **CSS Variables** - Design system

## 📁 Cấu trúc dự án

```
src/
├── components/          # Reusable components
├── pages/              # Page components
│   ├── LoginPage.tsx   # Login page
│   └── LoginPage.scss  # Login page styles
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   └── validation.ts   # Form validation
├── types/              # TypeScript type definitions
│   └── auth.ts         # Authentication types
├── styles/             # Global styles
│   └── GlobalStyle.scss # Global CSS variables & utilities
├── assets/             # Static assets
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

## 🎨 Bảng màu

### Primary Colors
- **Primary**: `#643FDB` - Màu chính
- **Ascent**: `#FF8A00` - Màu phụ

### Neutral Colors
- **Dark**: `#1C1243` - Text chính
- **Medium**: `#A29EB6` - Text phụ
- **Light**: `#EFF1F3` - Background phụ
- **White**: `#FFFFFF` - Background chính

### Semantic Colors
- **Success**: `#47C272` - Thành công
- **Error**: `#FF6A5D` - Lỗi

## 🚀 Cách chạy dự án

### Cài đặt dependencies
```bash
npm install
```

### Chạy development server
```bash
npm run dev
```

### Build production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 📱 Responsive Design

Dự án được thiết kế responsive với các breakpoints:
- **Desktop**: ≥ 769px
- **Tablet**: 481px - 768px  
- **Mobile**: ≤ 480px

## 🌙 Dark Mode

Hệ thống hỗ trợ dark mode tự động thông qua `prefers-color-scheme: dark`.

## 🔧 Development

### Cấu trúc component chuẩn
```tsx
import React from 'react';
import './ComponentName.scss';

interface ComponentProps {
  // Props definition
}

const ComponentName: React.FC<ComponentProps> = ({ props }) => {
  // Component logic
  
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

### Sử dụng CSS Variables
```scss
.my-component {
  color: var(--primary-color);
  background-color: var(--background-primary);
  border: 1px solid var(--border-color);
}
```

### Utility Classes
```jsx
<div className="d-flex justify-center align-center">
  <button className="btn btn-primary">Button</button>
</div>
```

## 📝 TODO

- [ ] Tích hợp API authentication cho Admin
- [ ] Thêm trang Dashboard quản lý
- [ ] Implement routing với React Router
- [ ] Thêm state management (Redux/Zustand)
- [ ] Tích hợp DevExpress components
- [ ] Thêm quản lý người dùng mobile app
- [ ] Thêm thống kê và báo cáo
- [ ] Thêm unit tests
- [ ] Thêm E2E tests

## 🤝 Contributing

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📱 Ứng dụng di động

SmartReminder là ứng dụng di động nhắc lịch thông minh, nơi người dùng có thể:
- Đăng ký tài khoản
- Tạo và quản lý lịch trình
- Nhận thông báo nhắc nhở
- Đồng bộ dữ liệu

## 📄 License

Dự án này được phát triển cho SmartReminder Admin System - Hệ thống quản lý cho ứng dụng di động SmartReminder.
