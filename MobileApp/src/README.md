# AI Task Tracking Mobile - Cấu trúc Thư mục

## 📁 Cấu trúc Thư mục

```
src/
├── assets/                 # Tài nguyên ứng dụng
│   └── images/             # Hình ảnh, logo, icons
├── components/             # Các component tái sử dụng
│   └── TaskCard.tsx        # Component hiển thị task card
├── constants/              # Các hằng số ứng dụng
│   ├── Colors.ts           # Màu sắc theme
│   ├── Strings.ts          # Chuỗi văn bản tiếng Việt
│   ├── Dimensions.ts       # Kích thước, spacing, font size
│   └── index.ts            # Export tổng hợp
├── hooks/                  # Custom React hooks
│   ├── useAsyncStorage.ts  # Hook quản lý AsyncStorage
│   ├── useTheme.ts         # Hook quản lý theme
│   └── index.ts            # Export tổng hợp
├── navigation/             # Cấu hình navigation
│   └── AppNavigator.tsx    # Navigator chính
├── screens/                # Các màn hình ứng dụng
│   ├── SplashScreen.tsx    # Màn hình splash
│   └── TaskListScreen.tsx  # Màn hình danh sách task
├── services/               # Các service xử lý logic
│   ├── NavigationService.ts # Service điều hướng
│   ├── TaskService.ts      # Service quản lý task
│   └── index.ts            # Export tổng hợp
├── types/                  # TypeScript type definitions
│   ├── Task.ts             # Types cho Task
│   ├── Navigation.ts       # Types cho Navigation
│   └── index.ts            # Export tổng hợp
├── utils/                  # Các hàm tiện ích
│   ├── helpers.ts          # Hàm helper tổng quát
│   └── index.ts            # Export tổng hợp
└── README.md              # Tài liệu hướng dẫn
```

## 🚀 Tính năng đã thiết lập

### ✅ Splash Screen
- **React Native Component**: `SplashScreen.tsx` với animation và loading
- **Android Native**: Cấu hình trong `styles.xml`, `AndroidManifest.xml`  
- **iOS Native**: Cấu hình trong `LaunchScreen.storyboard`
- **Navigation**: Tự động chuyển sang màn hình chính sau 2.5 giây

### ✅ Navigation
- **React Navigation v6**: Stack Navigator với TypeScript
- **Navigation Service**: Điều hướng programmatic
- **Type Safety**: Đầy đủ TypeScript types

### ✅ Cấu trúc Code Chuẩn
- **Constants**: Quản lý màu sắc, string, dimensions tập trung
- **Services**: Tách biệt logic business ra khỏi UI
- **Hooks**: Custom hooks cho các chức năng phổ biến
- **Types**: TypeScript definitions đầy đủ
- **Utils**: Hàm helper tái sử dụng

### ✅ Theme System
- **Light/Dark Mode**: Tự động detect system theme
- **Custom Colors**: Bảng màu nhất quán cho toàn app
- **Material Design 3**: Sử dụng React Native Paper

## 📱 Cách sử dụng

### Import từ các thư mục:

```typescript
// Constants
import { Colors, Strings, Spacing } from '../constants';

// Services  
import { TaskService, navigate } from '../services';

// Hooks
import { useTheme, useAsyncStorage } from '../hooks';

// Types
import { Task, TaskStatus } from '../types';

// Utils
import { formatDate, getStatusText } from '../utils';
```

### Tạo màn hình mới:

1. Tạo file trong `screens/`
2. Add type vào `types/Navigation.ts`
3. Cấu hình route trong `AppNavigator.tsx`

### Tạo component mới:

1. Tạo file trong `components/`
2. Sử dụng constants cho styling
3. Export trong `components/index.ts`

## 🎨 Design System

- **Primary Color**: #2196F3 (Material Blue)
- **Font**: System default với sizes chuẩn
- **Spacing**: Hệ thống spacing 4px base
- **Language**: Tiếng Việt hoàn toàn

## 📝 Quy ước Code

- **File Names**: PascalCase cho components, camelCase cho utils
- **Folder Names**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Comments**: Tiếng Anh cho code, tiếng Việt cho user-facing text
- **Exports**: Sử dụng index.ts files cho clean imports
