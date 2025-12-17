# TaskTracking - Ứng dụng Nhắc lịch Thông minh
# TaskTracking - Smart Reminder Application

<div align="center">
  <h3>🚀 Ứng dụng quản lý công việc và nhắc nhở thông minh</h3>
  <h3>🚀 Smart Task Management and Reminder Application</h3>
</div>

---

## 📖 Giới thiệu / Introduction

**Tiếng Việt:**

TaskTracking là một hệ thống quản lý công việc và nhắc nhở thông minh, giúp người dùng theo dõi và tổ chức các công việc của mình một cách hiệu quả. Ứng dụng được xây dựng với kiến trúc full-stack, bao gồm:
- Backend API sử dụng NestJS và PostgreSQL
- Ứng dụng di động cross-platform với React Native
- Giao diện web quản trị với React và Vite

**English:**

TaskTracking is a smart task management and reminder system that helps users track and organize their tasks efficiently. The application is built with a full-stack architecture, including:
- Backend API using NestJS and PostgreSQL
- Cross-platform mobile application with React Native
- Web admin interface with React and Vite

---

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

### Website
- **React** 18.3.1 - Modern UI library
- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe development
- **Ant Design** - Enterprise UI components
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **SCSS** - Advanced styling

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

**English:**
- 📝 **Task Management**: Create, edit, delete, and update task status
- 🔍 **Search & Filter**: Search tasks by multiple criteria
- 📊 **Status Classification**: Todo, In Progress, Done, Cancelled
- ⚡ **Priority Levels**: Low, Medium, High, Urgent with color coding
- 🔔 **Smart Notifications**: Push notifications, Email, and SMS
- 👥 **User Management**: Registration, login, and role-based access
- 📅 **Task Calendar**: View tasks by day, week, month
- 🎨 **Friendly Interface**: Material Design with Dark/Light theme
- 📱 **Cross-platform**: Support for Android and iOS
- 🔄 **Realtime Sync**: Instant data updates
- 🔐 **Security**: JWT and Firebase authentication
- 💾 **Offline Support**: Work without internet connection

---

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
    ├── src/
    │   ├── components/   # Reusable UI components
    │   ├── pages/        # Page components
    │   ├── services/     # API services
    │   └── styles/       # SCSS styles
    └── package.json
```

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
```

**English:**

```bash
# Navigate to Backend directory
cd Backend

# Install dependencies
npm install

# Configure environment variables
# Create .env file and configure required environment variables
# Example: DATABASE_URL, JWT_SECRET, FIREBASE_CONFIG, etc.

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed database with sample data
npm run prisma:seed

# Start backend server
npm run start:dev
```

Backend server will run at: `http://localhost:3000`

📚 **Chi tiết / Details**: [Backend README](./Backend/README.md)

### 3. Mobile App Setup

**Tiếng Việt:**

```bash
# Di chuyển vào thư mục MobileApp
cd MobileApp

# Cài đặt dependencies
npm install

# Chạy trên Android
npm run android

# Chạy trên iOS (macOS only)
npm run ios
```

**English:**

```bash
# Navigate to MobileApp directory
cd MobileApp

# Install dependencies
npm install

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

📚 **Chi tiết / Details**: [MobileApp README](./MobileApp/README.md)

### 4. Website Setup

**Tiếng Việt:**

```bash
# Di chuyển vào thư mục Website
cd Website

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build
```

**English:**

```bash
# Navigate to Website directory
cd Website

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Website will run at: `http://localhost:5173`

---

## 📱 Sử dụng / Usage

### Backend API

Backend API cung cấp các endpoints RESTful cho:
- Authentication (đăng ký, đăng nhập)
- User management
- Task CRUD operations
- Notifications (push, email, SMS)
- Task assignments and invitations

API Documentation: Xem tại `http://localhost:3000/api/docs` (khi server đang chạy)

### Mobile Application

Ứng dụng di động cung cấp:
- Giao diện thân thiện và dễ sử dụng
- Quản lý công việc với đầy đủ tính năng
- Nhận thông báo push notifications
- Làm việc offline
- Đồng bộ dữ liệu realtime

### Web Application

Website quản trị cung cấp:
- Dashboard tổng quan
- Quản lý users và roles
- Quản lý tasks nâng cao
- Reports và analytics
- System configuration

---

## 🧪 Testing

### Backend Testing
```bash
cd Backend
npm test              # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Generate coverage report
```

### Mobile Testing
```bash
cd MobileApp
npm test              # Run all tests
npm run test:watch   # Run tests in watch mode
```

### Website Testing
```bash
cd Website
npm test              # Run all tests
```

---

## 🐛 Troubleshooting

### Backend Issues

**Database connection failed:**
```bash
# Kiểm tra PostgreSQL đang chạy
# Kiểm tra DATABASE_URL trong .env file
npm run prisma:studio  # Mở Prisma Studio để kiểm tra database
```

### Mobile App Issues

**Metro bundler không khởi động:**
```bash
npm start -- --reset-cache
```

**Build Android failed:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

Xem thêm chi tiết trong [MobileApp README](./MobileApp/README.md)

---

## 🤝 Đóng góp / Contributing

**Tiếng Việt:**

Chúng tôi hoan nghênh mọi đóng góp! Để đóng góp:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

**English:**

We welcome all contributions! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

### Coding Standards

- TypeScript strict mode
- ESLint + Prettier for code formatting
- Conventional commits
- Component-based architecture
- Comprehensive code comments (Vietnamese or English)
- Unit tests for critical features

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 TaskTracking

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Team & Contact

### Development Team
- **Backend Team**: NestJS API development
- **Mobile Team**: React Native development
- **Web Team**: React web application development
- **DevOps Team**: CI/CD and deployment automation
- **UI/UX Team**: Design system and user experience

### Contact Information

- **Repository**: [github.com/anhthuu18/TaskTracking](https://github.com/anhthuu18/TaskTracking)
- **Issues**: [GitHub Issues](https://github.com/anhthuu18/TaskTracking/issues)
- **Author**: anhthuu18

---

## 🗺️ Roadmap

### ✅ Phase 1 - MVP (Completed)
- [x] Backend API với NestJS và Prisma
- [x] Mobile app với React Native
- [x] Web admin interface
- [x] Authentication và Authorization
- [x] Task CRUD operations
- [x] Push notifications

### 🚧 Phase 2 - Enhancement (In Progress)
- [ ] Advanced search và filtering
- [ ] Team collaboration features
- [ ] Calendar view với drag & drop
- [ ] File attachments
- [ ] Comments và activity log
- [ ] Email và SMS notifications

### 📋 Phase 3 - Advanced Features (Planned)
- [ ] AI-powered task suggestions
- [ ] Voice commands
- [ ] Analytics và reporting dashboard
- [ ] Time tracking
- [ ] Project management
- [ ] Integration với third-party tools (Google Calendar, Slack, etc.)

### 🚀 Phase 4 - Scale & Optimize (Future)
- [ ] Microservices architecture
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Mobile app optimization
- [ ] Performance improvements
- [ ] Multi-language support

---

## 📊 Project Statistics

- **Languages**: TypeScript (98%), SCSS (1.5%), Kotlin (0.2%), Ruby (0.1%), JavaScript (0.1%), Swift (0.1%)
- **Architecture**: Full-stack (Backend, Mobile, Web)
- **Platform**: Cross-platform (Web, Android, iOS)
- **License**: MIT

---

## 🌟 Acknowledgments

- NestJS team for the amazing framework
- React Native community
- All contributors and supporters

---

<div align="center">
  <p>⭐ Star this repository if you find it helpful!</p>
  <p>Made with ❤️ by TaskTracking Team</p>
</div>
