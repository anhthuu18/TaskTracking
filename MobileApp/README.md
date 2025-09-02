# AI Task Tracking Mobile

Ứng dụng React Native cho quản lý công việc và theo dõi tiến độ task với giao diện thân thiện người dùng.

## Tính năng chính

- **Quản lý Task**: Tạo, chỉnh sửa, xóa và cập nhật trạng thái công việc
- **Tìm kiếm & Lọc**: Tìm kiếm task theo tiêu đề, mô tả, assignee hoặc tags
- **Phân loại trạng thái**: Todo, In Progress, Done, Cancelled
- **Độ ưu tiên**: Low, Medium, High, Urgent với màu sắc phân biệt
- **Material Design**: Giao diện đẹp mắt với React Native Paper
- **Dark/Light Theme**: Tự động theo hệ thống
- **Responsive**: Tương thích với nhiều kích thước màn hình

## Screenshots

*Screenshots sẽ được thêm sau khi ứng dụng hoàn thiện*

## Công nghệ sử dụng

- **React Native** 0.81.0 - Framework phát triển mobile cross-platform
- **TypeScript** - Type safety và developer experience tốt hơn
- **React Native Paper** - Material Design components
- **React Navigation** - Navigation giữa các màn hình
- **React Native Vector Icons** - Icon library phong phú
- **AsyncStorage** - Local storage cho dữ liệu offline

## Yêu cầu hệ thống

### Windows Development:
- Node.js 18+ 
- npm 8+
- Java Development Kit (JDK) 17
- Android Studio với Android SDK
- Git

### Kiểm tra môi trường:
```bash
node --version        # >= 18.0.0
npm --version         # >= 8.0.0
java -version         # JDK 17
npx react-native doctor  # Kiểm tra setup React Native
```

## Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd AITaskTrackingMobile
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Setup Android development environment
Xem hướng dẫn chi tiết trong file [`ANDROID_SETUP_GUIDE.md`](./ANDROID_SETUP_GUIDE.md)

### 4. Khởi động emulator Android
```bash
# Xem danh sách AVD
emulator -list-avds

# Khởi động emulator
emulator -avd <TEN_AVD>
```

### 5. Chạy ứng dụng
```bash
# Terminal 1: Khởi động Metro bundler
npm start

# Terminal 2: Build và chạy trên Android
npm run android
```

## Hướng dẫn chi tiết

-  [Android Setup Guide](./ANDROID_SETUP_GUIDE.md) - Hướng dẫn setup môi trường Android development
-  [Build and Run Guide](./BUILD_AND_RUN_GUIDE.md) - Hướng dẫn build và chạy ứng dụng
-  [Troubleshooting](./BUILD_AND_RUN_GUIDE.md#bước-8-troubleshooting) - Giải quyết các lỗi thường gặp

## Cấu trúc dự án

```
AITaskTrackingMobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── TaskCard.tsx     # Task card component
│   ├── screens/            # Screen components
│   │   └── TaskListScreen.tsx
│   ├── types/              # TypeScript type definitions
│   │   └── Task.ts
│   ├── navigation/         # Navigation setup (future)
│   └── utils/             # Utility functions (future)
├── android/               # Android-specific code
├── ios/                   # iOS-specific code (future)
├── App.tsx               # Main app component
├── package.json          # Dependencies và scripts
└── README.md            # Documentation
```

## Roadmap

### Phase 1 - MVP (Hiện tại)
- [x] Giao diện danh sách task
- [x] Task card với thông tin đầy đủ
- [x] Filter theo trạng thái
- [x] Tìm kiếm task
- [x] Theme support

### Phase 2 - Core Features
- [ ] Tạo/Chỉnh sửa task
- [ ] Navigation giữa các màn hình
- [ ] Chi tiết task
- [ ] Quản lý assignee
- [ ] Calendar view

### Phase 3 - Advanced Features
- [ ] Tích hợp API backend
- [ ] Authentication (đăng nhập/đăng ký)
- [ ] Push notifications
- [ ] Offline support
- [ ] Data sync

### Phase 4 - Enterprise Features
- [ ] Team collaboration
- [ ] Project management
- [ ] Time tracking
- [ ] Reports và analytics
- [ ] File attachments

## 🔧 Available Scripts

```bash
npm start              # Khởi động Metro bundler
npm run android        # Build và chạy trên Android
npm run ios           # Build và chạy trên iOS (MacOS only)
npm run lint          # Chạy ESLint
npm test              # Chạy tests
npm run clean         # Clean React Native cache
```

## Troubleshooting

### Lỗi "Unable to load script"
```bash
npm start -- --reset-cache
```

### Metro bundler không khởi động
```bash
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### Build Android failed
```bash
cd android
./gradlew clean
cd ..
npm run android
```

Xem thêm các lỗi thường gặp và cách khắc phục trong [Build and Run Guide](./BUILD_AND_RUN_GUIDE.md).

## Performance

### Metrics mục tiêu:
- **App startup time**: < 3 giây
- **Screen transition**: < 300ms
- **List scrolling**: 60 FPS
- **APK size**: < 50MB

### Optimization techniques:
- Code splitting
- Image optimization
- Bundle size analysis
- Memory profiling

## Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

### Coding Standards:
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Component-based architecture

## License

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Team

- **Frontend Mobile**: React Native development
- **Backend**: API development (future)
- **UI/UX**: Design system và user experience
- **DevOps**: CI/CD và deployment automation

## Support

- Email: support@aitasktracking.com
- Mobile: +84 xxx xxx xxx
- Slack: #ai-task-tracking
- Issues: [GitHub Issues](https://github.com/your-org/ai-task-tracking-mobile/issues)

---

⭐ **Star this repo if you find it helpful!**
