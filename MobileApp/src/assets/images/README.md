# Onboarding Images

Thư mục này chứa các hình ảnh cho màn hình Onboarding.

## Files cần thêm:

1. **onboarding1.png** - Illustration cho màn hình đầu tiên
   - Mô tả: Nhân vật với task board
   - Kích thước khuyến nghị: 300x300px
   - Format: PNG với background trong suốt

2. **onboarding2.png** - Illustration cho màn hình thứ hai  
   - Mô tả: Nhân vật với charts & analytics
   - Kích thước khuyến nghị: 300x300px
   - Format: PNG với background trong suốt

3. **onboarding3.png** - Illustration cho màn hình thứ ba
   - Mô tả: Nhân vật với analytics dashboard
   - Kích thước khuyến nghị: 300x300px
   - Format: PNG với background trong suốt

## Sau khi thêm images:

Uncomment các dòng trong `OnboardingScreen.tsx`:
```typescript
// image: require('../assets/images/onboarding1.png'),
// image: require('../assets/images/onboarding2.png'), 
// image: require('../assets/images/onboarding3.png'),
```

Và thay thế `imagePlaceholder` view bằng:
```typescript
<Image source={item.image} style={styles.image} resizeMode="contain" />
```
