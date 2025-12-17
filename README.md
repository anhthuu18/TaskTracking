# TaskTracking - Ứng dụng Nhắc lịch Thông minh


## 📖 Giới thiệu / Introduction

**Tiếng Việt:**

TaskTracking là một hệ thống quản lý công việc và nhắc nhở thông minh, giúp người dùng theo dõi và tổ chức các công việc của mình một cách hiệu quả. Ứng dụng được xây dựng với kiến trúc full-stack, bao gồm:
- Backend API sử dụng NestJS và PostgreSQL
- Ứng dụng di động cross-platform với React Native
- Giao diện web quản trị với React và Vite

## 🛠️ Công nghệ sử dụng / Technology Stack

### Backend
- **NestJS** - Node.js framework for building scalable server-side applications
- **Prisma** - Modern database ORM
- **PostgreSQL** - Relational database
- **TypeScript** - Type-safe development
- **JWT** - Authentication and authorization
- **Firebase Admin** - Push notifications and cloud services
- **Nodemailer** - Email notifications
- **Twilio** - SMS notifications

### Mobile Application
- **React Native** 0.81.0 - Cross-platform mobile development
- **TypeScript** - Type safety and better developer experience
- **React Native Paper** - Material Design components
- **React Navigation** - Navigation framework
- **AsyncStorage** - Local data persistence
- **Firebase** - Authentication and push notifications
- **Notifee** - Advanced notification handling


### Development Tools
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Jest** - Testing framework

---

## ✨ Tính năng chính / Key Features

**Tiếng Việt:**
- 📝 **Quản lý công việc**: Tạo, chỉnh sửa, xóa và cập nhật trạng thái công việc
- 🔍 **Tìm kiếm & Lọc**: Tìm kiếm task theo nhiều tiêu chí
- 📊 **Phân loại trạng thái**: Todo, In Progress, Done, Cancelled
- ⚡ **Độ ưu tiên**: Low, Medium, High, Urgent với màu sắc phân biệt
- 🔔 **Thông báo thông minh**: Push notification, Email, và SMS
- 👥 **Quản lý người dùng**: Đăng ký, đăng nhập, phân quyền
- 📅 **Lịch công việc**: Xem công việc theo ngày, tuần, tháng
- 🎨 **Giao diện thân thiện**: Material Design với Dark/Light theme
- 📱 **Cross-platform**: Hỗ trợ Android và iOS
- 🔄 **Đồng bộ realtime**: Cập nhật dữ liệu tức thời
- 🔐 **Bảo mật**: Authentication với JWT và Firebase
- 💾 **Offline support**: Làm việc ngay cả khi không có internet


## 📁 Cấu trúc dự án / Project Structure

```
TaskTracking/
├── Backend/               # Backend API (NestJS)
│   ├── src/
│   │   ├── common/       # Shared utilities and helpers
│   │   ├── modules/      # Feature modules (users, tasks, auth, etc.)
│   │   └── prisma/       # Database configuration and schema
│   ├── prisma/           # Prisma migrations and seeds
│   └── package.json
│
├── MobileApp/            # React Native Mobile Application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── screens/      # Screen components
│   │   ├── types/        # TypeScript type definitions
│   │   ├── navigation/   # Navigation configuration
│   │   └── utils/        # Utility functions
│   ├── android/          # Android-specific code
│   ├── ios/              # iOS-specific code
│   └── package.json
│
└── Website/              # React Web Application
  

---

## 🚀 Cài đặt và chạy / Installation and Setup

### Yêu cầu hệ thống / Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **PostgreSQL** >= 13.0
- **Java Development Kit (JDK)** 17 (for Android development)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/anhthuu18/TaskTracking.git
cd TaskTracking
```

### 2. Backend Setup

**Tiếng Việt:**

```bash
# Di chuyển vào thư mục Backend
cd Backend

# Cài đặt dependencies
npm install

# Cấu hình environment variables
# Tạo file .env và cấu hình các biến môi trường cần thiết
# Ví dụ: DATABASE_URL, JWT_SECRET, FIREBASE_CONFIG, etc.

# Generate Prisma client
npm run prisma:generate

# Chạy database migrations
npm run prisma:migrate

# (Optional) Seed database với dữ liệu mẫu
npm run prisma:seed

# Khởi động backend server
npm run start:dev
