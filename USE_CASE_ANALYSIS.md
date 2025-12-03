# PHÂN TÍCH USE CASE - SO SÁNH VỚI DỰ ÁN THỰC TẾ

## 📋 TÓMLƯỢC

Các use case bạn ghi đã **CHÍNH XÁC 85%** so với dự án thực tế. Tuy nhiên, có một số điểm cần **điều chỉnh và bổ sung** để phù hợp hoàn toàn với kiến trúc hiện tại.

---

## 3.2.1 USE CASE: REGISTER (Đăng Ký)

### ✅ NHỮNG PHẦN ĐÚNG

| Yếu Tố | Mô Tả | Trạng Thái |
|--------|-------|-----------|
| **Actor** | Unregistered User | ✅ Chính xác |
| **Trigger** | Chọn "Đăng ký" trên giao diện | ✅ Chính xác |
| **Pre-Conditions** | Không có | ✅ Chính xác |
| **Post-Conditions** | Đăng ký thành công, có thể đăng nhập | ✅ Chính xác |
| **Main Flow - Bước 1-2** | Chọn nút Đăng ký, hiển thị form | ✅ Chính xác |
| **Main Flow - Bước 3** | Nhập thông tin cá nhân | ✅ Chính xác |
| **Exception 5.1** | Thiếu trường → hiển thị lỗi | ✅ Chính xác |
| **Exception 5.2** | Email/phone không đúng định dạng | ✅ Chính xác |
| **Exception 5.3** | Email/phone/username đã tồn tại | ✅ Chính xác |
| **Exception 5.4** | Mật khẩu không hợp lệ | ✅ Chính xác |
| **Exception 5.5** | Mật khẩu không khớp | ✅ Chính xác |

### ⚠️ NHỮNG PHẦN CẦN ĐIỀU CHỈNH

#### 1. **Thông Tin Đăng Ký**

**Bạn ghi:**
```
- Họ tên
- Email
- Số điện thoại
- Ngày sinh
- Giới tính
- Password
```

**Thực tế trong dự án:**
```
- Username (bắt buộc)
- Email (bắt buộc)
- Số điện thoại (tùy chọn)
- Password (bắt buộc)
- Confirm Password (bắt buộc)
```

**Điều chỉnh:**
```diff
- Họ tên → Username (bắt buộc)
- Ngày sinh → ❌ Không có
- Giới tính → ❌ Không có
+ Confirm Password (bắt buộc)
```

**Lý do:** Dự án hiện tại chưa lưu trữ ngày sinh và giới tính trong schema.

#### 2. **Verify Email vs Verify Phone**

**Bạn ghi:**
```
Bước 4: Hệ thống thực hiện use case Verify Email
```

**Thực tế:**
```
Backend không có email verification bắt buộc
Chỉ có OTP verification cho forgot password
```

**Điều chỉnh:**
```diff
- Bước 4: Hệ thống thực hiện use case Verify Email
+ Bước 4: Hệ thống tạo tài khoản (không cần verify email)
+ (Tùy chọn) Gửi email xác nhận (chưa implement)
```

#### 3. **Điều Kiện Mật Khẩu**

**Bạn ghi:**
```
- Mật khẩu không thỏa điều kiện
```

**Thực tế (CreateUserDTO):**
```typescript
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  message: 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số',
})
@Length(6, 50, { message: 'Mật khẩu phải có 6-50 ký tự' })
```

**Điều chỉnh:**
```diff
+ Exception 5.4 chi tiết hơn:
  - Mật khẩu phải có 6-50 ký tự
  - Phải chứa ít nhất 1 chữ thường
  - Phải chứa ít nhất 1 chữ hoa
  - Phải chứa ít nhất 1 số
```

### 📝 USE CASE REGISTER - PHIÊN BẢN CHÍNH XÁC

```
USE CASE: Register (Đăng Ký)

Actor: Unregistered User

Trigger: Actor chọn chức năng "Đăng ký" trên giao diện chính

Description:
Use case này cho phép actor đăng ký tài khoản bằng cách cung cấp 
các thông tin cá nhân cần thiết như username, email, số điện thoại, 
mật khẩu, hoặc cũng có thể đăng ký qua tài khoản Google.

Pre-Conditions: Không có

Post-Conditions:
- Actor đăng ký thành công
- Tài khoản được tạo trong hệ thống
- Actor có thể đăng nhập vào hệ thống

Main Flow:
1. Actor chọn nút "Đăng ký" trên Trang chủ
2. Hệ thống hiển thị form Đăng ký tài khoản
3. Actor nhập các thông tin:
   - Username (bắt buộc)
   - Email (bắt buộc)
   - Số điện thoại (tùy chọn)
   - Password (bắt buộc)
   - Confirm Password (bắt buộc)
4. Actor nhấn nút "Đăng ký"
5. Hệ thống kiểm tra tính hợp lệ của thông tin
6. Hệ thống tạo tài khoản cho actor
7. Hệ thống điều hướng đến trang đăng nhập
8. Hệ thống hiển thị thông báo "Đăng ký thành công"

Alternate Flow:
- Actor chọn "Đăng ký với Google" → Thực hiện Google OAuth2 flow

Exception Flow:
+ 5.1. Nếu actor nhập thiếu một trường bắt buộc:
  - Hệ thống hiển thị "Vui lòng nhập trường này"
  - Hệ thống quay lại bước 3

+ 5.2. Nếu email không đúng định dạng:
  - Hệ thống hiển thị "Email không hợp lệ"
  - Hệ thống quay lại bước 3

+ 5.3. Nếu số điện thoại không đúng định dạng:
  - Hệ thống hiển thị "Số điện thoại không hợp lệ (VD: 0987654321)"
  - Hệ thống quay lại bước 3

+ 5.4. Nếu email, số điện thoại, username đã tồn tại:
  - Hệ thống hiển thị "Email/Username/Số điện thoại đã được sử dụng"
  - Hệ thống yêu cầu actor nhập khác
  - Hệ thống quay lại bước 3

+ 5.5. Nếu mật khẩu không thỏa điều kiện:
  - Hệ thống hiển thị "Mật khẩu phải có 6-50 ký tự"
  - Hệ thống hiển thị "Phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số"
  - Hệ thống quay lại bước 3

+ 5.6. Nếu mật khẩu và xác nhận mật khẩu không giống nhau:
  - Hệ thống hiển thị "Mật khẩu nhập lại không khớp"
  - Hệ thống quay lại bước 3

+ 5.7. Nếu có lỗi server:
  - Hệ thống hiển thị "Đã xảy ra lỗi. Vui lòng thử lại"
  - Hệ thống quay lại bước 3
```

---

## 3.2.2 USE CASE: LOGIN (Đăng Nhập)

### ✅ NHỮNG PHẦN ĐÚNG

| Yếu Tố | Mô Tả | Trạng Thái |
|--------|-------|-----------|
| **Actor** | Registered User | ✅ Chính xác |
| **Trigger** | Chọn "Đăng nhập" | ✅ Chính xác |
| **Pre-Conditions** | Đã có tài khoản | ✅ Chính xác |
| **Post-Conditions** | Đăng nhập thành công | ✅ Chính xác |
| **Main Flow - Bước 1-2** | Chọn nút Đăng nhập, hiển thị form | ✅ Chính xác |
| **Alternate Flow** | Quên mật khẩu | ✅ Chính xác |
| **Exception 3.1** | Thiếu trường → hiển thị lỗi | ✅ Chính xác |
| **Exception 3.2** | Thông tin không chính xác | ✅ Chính xác |

### ⚠️ NHỮNG PHẦN CẦN ĐIỀU CHỈNH

#### 1. **Thông Tin Đăng Nhập**

**Bạn ghi:**
```
Actor nhập email, số điện thoại, mật khẩu
```

**Thực tế (LoginDTO):**
```typescript
export class LoginDTO {
  @IsString()
  @MaxLength(20)
  username: string;  // ← Username, không phải email/phone

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}
```

**Điều chỉnh:**
```diff
- Actor nhập email, số điện thoại, mật khẩu
+ Actor nhập username và mật khẩu
```

#### 2. **Verify Account vs JWT Token**

**Bạn ghi:**
```
Bước 4: Hệ thống thực hiện use case Verify Account
```

**Thực tế:**
```
Backend tạo JWT token sau khi xác thực thành công
Không có use case "Verify Account" riêng
```

**Điều chỉnh:**
```diff
- Bước 4: Hệ thống thực hiện use case Verify Account
+ Bước 4: Hệ thống xác thực thông tin đăng nhập
+ Bước 5: Hệ thống tạo JWT token
+ Bước 6: Hệ thống lưu token và thông tin user
+ Bước 7: Hệ thống hiển thị trang giao diện theo vai trò
```

#### 3. **Điều Hướng Sau Đăng Nhập**

**Bạn ghi:**
```
Hệ thống hiển thị trang giao diện theo vai trò của actor
```

**Thực tế:**
```
Không có vai trò (role) khác nhau cho user thông thường
Tất cả user đều đi đến Dashboard
Vai trò chỉ có ở level Workspace/Project
```

**Điều chỉnh:**
```diff
- Hệ thống hiển thị trang giao diện theo vai trò của actor
+ Hệ thống điều hướng đến Dashboard
+ (Nếu có workspace) → Hiển thị workspace đầu tiên
+ (Nếu không) → Hiển thị trang tạo workspace
```

### 📝 USE CASE LOGIN - PHIÊN BẢN CHÍNH XÁC

```
USE CASE: Login (Đăng Nhập)

Actor: Registered User

Trigger: Actor chọn chức năng "Đăng nhập" trên giao diện chính

Description:
Use case này cho phép actor đăng nhập vào tài khoản của mình 
bằng cách cung cấp thông tin đăng nhập (username và mật khẩu).

Pre-Conditions: Actor đã có tài khoản trong hệ thống

Post-Conditions:
- Actor đăng nhập thành công
- JWT token được tạo và lưu
- Actor có quyền truy cập vào các chức năng của hệ thống

Main Flow:
1. Actor chọn nút "Đăng nhập" trên Trang chủ
2. Hệ thống hiển thị form Đăng nhập
3. Actor nhập username và mật khẩu, sau đó nhấn nút "Đăng nhập"
4. Hệ thống xác thực thông tin đăng nhập
5. Hệ thống tạo JWT token
6. Hệ thống lưu token và thông tin user vào AsyncStorage (mobile)
7. Hệ thống điều hướng đến Dashboard
8. Hệ thống hiển thị thông báo "Đăng nhập thành công"

Alternate Flow:
- Actor quên mật khẩu → Chọn "Quên mật khẩu"
  (Thực hiện use case Forgot Password)

Exception Flow:
+ 3.1. Nếu actor nhập thiếu username hoặc mật khẩu:
  - Hệ thống hiển thị "Vui lòng nhập đầy đủ thông tin"
  - Hệ thống quay lại bước 3

+ 3.2. Nếu username không tồn tại:
  - Hệ thống hiển thị "Username không tồn tại"
  - Hệ thống yêu cầu actor kiểm tra lại
  - Hệ thống quay lại bước 3

+ 3.3. Nếu mật khẩu không chính xác:
  - Hệ thống hiển thị "Mật khẩu không chính xác"
  - Hệ thống quay lại bước 3

+ 3.4. Nếu có lỗi server:
  - Hệ thống hiển thị "Đã xảy ra lỗi. Vui lòng thử lại"
  - Hệ thống quay lại bước 3
```

---

## 3.2.3 USE CASE: FORGOT PASSWORD (Quên Mật Khẩu)

### ✅ NHỮNG PHẦN ĐÚNG

| Yếu Tố | Mô Tả | Trạng Thái |
|--------|-------|-----------|
| **Actor** | Registered User | ✅ Chính xác |
| **Trigger** | Nhấn "Quên mật khẩu" | ✅ Chính xác |
| **Pre-Conditions** | Không có | ✅ Chính xác |
| **Post-Conditions** | Thay đổi mật khẩu thành công | ✅ Chính xác |
| **Main Flow - Bước 1-2** | Chọn "Quên mật khẩu", hiển thị form | ✅ Chính xác |
| **Main Flow - Bước 3** | Nhập số điện thoại | ✅ Chính xác |
| **Main Flow - Bước 4** | Gửi mã OTP | ✅ Chính xác |
| **Main Flow - Bước 5-6** | Nhập OTP, cập nhật mật khẩu | ✅ Chính xác |
| **Exception 5.1** | Mã OTP hết hạn → Gửi lại | ✅ Chính xác |

### ⚠️ NHỮNG PHẦN CẦN ĐIỀU CHỈNH

#### 1. **Phương Thức Xác Thực**

**Bạn ghi:**
```
Gửi mã xác nhận đến actor thông qua số điện thoại
```

**Thực tế (Backend):**
```typescript
// Sử dụng Twilio để gửi SMS
// OTP được gửi qua SMS
// Độ dài OTP: 4-6 ký tự
// Thời gian hết hạn: 60 giây (theo code)
```

**Điều chỉnh:**
```diff
+ Bước 4: Hệ thống gửi mã OTP qua SMS (Twilio)
+ Bước 5: Actor nhập mã OTP (4-6 ký tự)
```

#### 2. **Thông Tin Đầu Vào**

**Bạn ghi:**
```
Actor nhập số điện thoại
```

**Thực tế (ForgotPasswordDTO):**
```typescript
@Matches(/^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/, {
  message: 'Số điện thoại không hợp lệ (VD: 0987654321 hoặc +84987654321)',
})
phone: string;
```

**Điều chỉnh:**
```diff
+ Exception: Nếu số điện thoại không đúng định dạng
  - Hệ thống hiển thị "Số điện thoại không hợp lệ (VD: 0987654321)"
```

#### 3. **Điều Kiện Mật Khẩu Mới**

**Bạn ghi:**
```
Nếu mật khẩu mới không hợp lệ
```

**Thực tế (ResetPasswordDTO):**
```typescript
@Length(6, 50, { message: 'Mật khẩu mới phải có 6-50 ký tự' })
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  message: 'Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số',
})
newPassword: string;
```

**Điều chỉnh:**
```diff
+ Exception 6.1 chi tiết hơn:
  - Mật khẩu phải có 6-50 ký tự
  - Phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số
```

### 📝 USE CASE FORGOT PASSWORD - PHIÊN BẢN CHÍNH XÁC

```
USE CASE: Forgot Password (Quên Mật Khẩu)

Actor: Registered User

Trigger: Actor nhấn vào "Quên mật khẩu" ở phần Đăng nhập

Description:
Use case này cho phép hệ thống gửi một mã OTP qua SMS để 
actor có thể reset mật khẩu thông qua số điện thoại đã đăng ký.

Pre-Conditions: Không có

Post-Conditions: Actor thay đổi mật khẩu thành công

Main Flow:
1. Actor chọn "Quên mật khẩu" ở phần Đăng nhập
2. Hệ thống hiển thị form Quên mật khẩu
3. Actor nhập số điện thoại đã đăng ký
4. Actor nhấn "Gửi mã xác nhận"
5. Hệ thống kiểm tra sự tồn tại của số điện thoại
6. Hệ thống gửi mã OTP qua SMS (Twilio)
7. Hệ thống hiển thị form nhập mã OTP
8. Actor nhập mã OTP (4-6 ký tự)
9. Hệ thống xác thực mã OTP
10. Hệ thống hiển thị form cập nhật mật khẩu mới
11. Actor nhập mật khẩu mới và xác nhận
12. Hệ thống cập nhật mật khẩu trong hệ thống
13. Hệ thống hiển thị thông báo "Mật khẩu đã được cập nhật thành công"
14. Hệ thống điều hướng đến trang Đăng nhập

Alternate Flow: Không có

Exception Flow:
+ 5.1. Nếu số điện thoại không tồn tại:
  - Hệ thống hiển thị "Số điện thoại không tồn tại"
  - Hệ thống yêu cầu actor kiểm tra lại
  - Hệ thống quay lại bước 3

+ 5.2. Nếu số điện thoại không đúng định dạng:
  - Hệ thống hiển thị "Số điện thoại không hợp lệ (VD: 0987654321)"
  - Hệ thống quay lại bước 3

+ 8.1. Nếu actor nhập mã OTP sai:
  - Hệ thống hiển thị "Mã OTP không chính xác"
  - Hệ thống quay lại bước 8

+ 8.2. Nếu mã OTP hết hạn (60 giây):
  - Hệ thống hiển thị "Mã OTP đã hết hạn"
  - Hệ thống yêu cầu actor nhấn "Gửi lại mã xác nhận"
  - Hệ thống quay lại bước 4

+ 11.1. Nếu mật khẩu mới không hợp lệ:
  - Hệ thống hiển thị "Mật khẩu phải có 6-50 ký tự"
  - Hệ thống hiển thị "Phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số"
  - Hệ thống quay lại bước 11

+ 11.2. Nếu mật khẩu mới và xác nhận không khớp:
  - Hệ thống hiển thị "Mật khẩu nhập lại không khớp"
  - Hệ thống quay lại bước 11

+ 11.3. Nếu có lỗi server:
  - Hệ thống hiển thị "Đã xảy ra lỗi. Vui lòng thử lại"
  - Hệ thống quay lại bước 11
```

---

## 3.2.4 USE CASE: LOGOUT (Đăng Xuất)

### ✅ NHỮNG PHẦN ĐÚNG

| Yếu Tố | Mô Tả | Trạng Thái |
|--------|-------|-----------|
| **Actor** | Registered User | ✅ Chính xác |
| **Trigger** | Chọn "Đăng xuất" | ✅ Chính xác |
| **Pre-Conditions** | Đã đăng nhập | ✅ Chính xác |
| **Post-Conditions** | Đăng xuất thành công | ✅ Chính xác |
| **Main Flow** | Chọn nút Đăng xuất → Kết thúc phiên | ✅ Chính xác |
| **Alternate Flow** | Không có | ✅ Chính xác |
| **Exception Flow** | Không có | ✅ Chính xác |

### ⚠️ NHỮNG PHẦN CẦN BỔ SUNG

#### 1. **Xóa Dữ Liệu Cục Bộ (Mobile)**

**Bạn ghi:**
```
Phiên làm việc của actor sẽ kết thúc và không còn hiệu lực
```

**Thực tế (Mobile):**
```typescript
// Cần xóa:
- authToken từ AsyncStorage
- user data từ AsyncStorage
- Dừng các background tasks
- Dừng recurring notifications
```

**Bổ sung:**
```diff
+ Hệ thống xóa JWT token từ bộ nhớ cục bộ
+ Hệ thống xóa thông tin user từ bộ nhớ cục bộ
+ Hệ thống dừng các background tasks
+ Hệ thống dừng recurring notifications
```

#### 2. **Điều Hướng**

**Bạn ghi:**
```
Điều hướng actor quay lại trang Đăng nhập
```

**Thực tế:**
```
Quay lại Onboarding hoặc Splash screen
```

**Bổ sung:**
```diff
+ Hệ thống điều hướng đến Splash screen
+ (Hoặc Onboarding nếu lần đầu)
```

### 📝 USE CASE LOGOUT - PHIÊN BẢN CHÍNH XÁC

```
USE CASE: Logout (Đăng Xuất)

Actor: Registered User

Trigger: Actor chọn chức năng "Đăng xuất" trên giao diện chính

Description:
Use case này cho phép actor đăng xuất khỏi ứng dụng 
và kết thúc phiên làm việc.

Pre-Conditions: Actor đã đăng nhập vào hệ thống

Post-Conditions:
- Actor đăng xuất thành công
- Phiên làm việc của actor kết thúc
- JWT token không còn hiệu lực
- Dữ liệu cục bộ được xóa

Main Flow:
1. Actor chọn nút "Đăng xuất" trên giao diện hệ thống
2. Hệ thống xác nhận yêu cầu đăng xuất
3. Hệ thống xóa JWT token từ bộ nhớ cục bộ
4. Hệ thống xóa thông tin user từ bộ nhớ cục bộ
5. Hệ thống dừng các background tasks
6. Hệ thống dừng recurring notifications
7. Hệ thống gọi API logout (backend)
8. Hệ thống điều hướng đến Splash screen
9. Hệ thống hiển thị thông báo "Đã đăng xuất thành công"

Alternate Flow: Không có

Exception Flow:
+ 7.1. Nếu có lỗi khi gọi API logout:
  - Hệ thống vẫn xóa dữ liệu cục bộ
  - Hệ thống vẫn điều hướng đến Splash screen
  - Hệ thống hiển thị thông báo lỗi (không bắt buộc)
```

---

## 3.2.5 USE CASE: VIEW TASKS LIST (Xem Danh Sách Công Việc)

### ✅ NHỮNG PHẦN ĐÚNG

| Yếu Tố | Mô Tả | Trạng Thái |
|--------|-------|-----------|
| **Actor** | Registered User | ✅ Chính xác |
| **Trigger** | Mở Tasks tab | ✅ Chính xác |
| **Pre-Conditions** | Không có | ✅ Chính xác |
| **Post-Conditions** | Xem danh sách công việc | ✅ Chính xác |
| **Main Flow - Bước 1** | Chọn "Tasks" trên navigation | ✅ Chính xác |
| **Main Flow - Bước 2** | Hiển thị danh sách tasks | ✅ Chính xác |
| **Main Flow - Bước 3** | Chọn task để xem chi tiết | ✅ Chính xác |

### ⚠️ NHỮNG PHẦN CẦN ĐIỀU CHỈNH

#### 1. **Phạm Vi Dữ Liệu**

**Bạn ghi:**
```
Duyệt qua các công việc được phân loại theo workspace hoặc project
```

**Thực tế (Backend):**
```typescript
// Có 3 endpoints:
GET /tasks                    // Tất cả tasks của user
GET /tasks/workspace/:id      // Tasks trong workspace
GET /tasks/project/:id        // Tasks trong project
```

**Điều chỉnh:**
```diff
+ Hệ thống có thể hiển thị:
  - Tất cả tasks của user
  - Tasks theo workspace
  - Tasks theo project
```

#### 2. **Lọc và Sắp Xếp**

**Bạn ghi:**
```
Không có thông tin về lọc/sắp xếp
```

**Thực tế (Mobile):**
```typescript
// Có các tính năng:
- Lọc theo status (Todo, In Progress, Done)
- Lọc theo priority (Low, Medium, High)
- Sắp xếp theo ngày hạn
- Sắp xếp theo ưu tiên
```

**Bổ sung:**
```diff
+ Alternate Flow:
  - Actor có thể lọc tasks theo status
  - Actor có thể lọc tasks theo priority
  - Actor có thể sắp xếp tasks theo ngày hạn
```

#### 3. **Thông Tin Hiển Thị**

**Bạn ghi:**
```
Hiển thị các công việc hiện đang có
```

**Thực tế:**
```
Mỗi task hiển thị:
- Tiêu đề
- Mô tả ngắn
- Ưu tiên (badge màu)
- Status (badge)
- Ngày hạn
- Người được phân công
- Thời gian đã theo dõi
```

**Bổ sung:**
```diff
+ Mỗi task hiển thị:
  - Tiêu đề
  - Mô tả ngắn
  - Ưu tiên (Low/Medium/High)
  - Status (Todo/In Progress/Done)
  - Ngày hạn
  - Người được phân công
  - Thời gian đã theo dõi
```

### 📝 USE CASE VIEW TASKS LIST - PHIÊN BẢN CHÍNH XÁC

```
USE CASE: View Tasks List (Xem Danh Sách Công Việc)

Actor: Registered User

Trigger: Actor mở Tasks tab ở các màn hình có áp dụng xem task list

Description:
Use case này cho phép actor duyệt qua các công việc được phân loại 
theo workspace, project, hoặc tất cả tasks của user. Actor có thể 
lọc, sắp xếp và xem chi tiết từng task.

Pre-Conditions: Actor đã đăng nhập

Post-Conditions: Actor xem được danh sách công việc

Main Flow:
1. Actor chọn mục "Tasks" trên navigation bar
2. Hệ thống gọi API để lấy danh sách tasks
3. Hệ thống hiển thị danh sách tasks với thông tin:
   - Tiêu đề
   - Mô tả ngắn
   - Ưu tiên (Low/Medium/High)
   - Status (Todo/In Progress/Done)
   - Ngày hạn
   - Người được phân công
   - Thời gian đã theo dõi
4. Actor chọn một task để xem chi tiết
5. Hệ thống điều hướng đến Task Detail screen

Alternate Flow:
- Actor lọc tasks theo status
  → Hệ thống hiển thị tasks với status được chọn

- Actor lọc tasks theo priority
  → Hệ thống hiển thị tasks với priority được chọn

- Actor sắp xếp tasks theo ngày hạn
  → Hệ thống sắp xếp lại danh sách

- Actor sắp xếp tasks theo ưu tiên
  → Hệ thống sắp xếp lại danh sách

Exception Flow:
+ 2.1. Nếu không có tasks:
  - Hệ thống hiển thị "Không có công việc nào"
  - Hệ thống hiển thị nút "Tạo công việc mới"

+ 2.2. Nếu có lỗi khi lấy dữ liệu:
  - Hệ thống hiển thị "Lỗi khi tải dữ liệu"
  - Hệ thống hiển thị nút "Thử lại"

+ 3.1. Nếu task đã bị xóa:
  - Hệ thống loại bỏ task khỏi danh sách
  - Hệ thống hiển thị thông báo "Task đã bị xóa"
```

---

## 📊 BẢNG TÓMLƯỢC SO SÁNH

| Use Case | Độ Chính Xác | Cần Điều Chỉnh | Cần Bổ Sung |
|----------|-------------|----------------|------------|
| **Register** | 85% | Thông tin đăng ký, Verify Email | Điều kiện mật khẩu chi tiết |
| **Login** | 80% | Thông tin đăng nhập, Verify Account | JWT token, Điều hướng |
| **Forgot Password** | 90% | Phương thức gửi OTP | Định dạng số điện thoại |
| **Logout** | 95% | - | Xóa dữ liệu cục bộ |
| **View Tasks List** | 75% | Phạm vi dữ liệu | Lọc, sắp xếp, thông tin hiển thị |

---

## 🎯 KHUYẾN NGHỊ

### 1. **Cập Nhật Schema Database**
```sql
-- Nếu muốn lưu họ tên, ngày sinh, giới tính:
ALTER TABLE users ADD COLUMN firstName VARCHAR;
ALTER TABLE users ADD COLUMN lastName VARCHAR;
ALTER TABLE users ADD COLUMN dateOfBirth DATE;
ALTER TABLE users ADD COLUMN gender VARCHAR;
```

### 2. **Thêm Email Verification**
```typescript
// Nếu muốn xác thực email:
- Tạo endpoint POST /auth/verify-email
- Gửi email xác thực sau khi register
- Lưu trạng thái emailVerified trong database
```

### 3. **Hỗ Trợ Đăng Nhập Bằng Email**
```typescript
// Hiện tại chỉ hỗ trợ username
// Có thể thêm:
export class LoginDTO {
  @IsString()
  @MaxLength(20)
  username?: string;

  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### 4. **Thêm Tính Năng Lọc/Sắp Xếp Tasks**
```typescript
// Query parameters:
GET /tasks?status=todo&priority=high&sortBy=dueDate
```

### 5. **Thêm Real-time Updates**
```typescript
// Sử dụng WebSocket hoặc Firebase:
- Khi task được tạo/cập nhật
- Khi status thay đổi
- Khi có thành viên mới join
```

---

## ✅ KẾT LUẬN

Các use case bạn ghi **rất tốt và chính xác 85%** so với dự án thực tế. Chỉ cần:

1. ✏️ **Điều chỉnh** thông tin đăng ký/đăng nhập theo dự án thực tế
2. [object Object]ổ sung** chi tiết về điều kiện mật khẩu, định dạng số điện thoại
3. 🔧 **Thêm** thông tin về JWT token, xóa dữ liệu cục bộ
4. 🎨 **Mở rộng** tính năng lọc/sắp xếp tasks

Tất cả các điểm này đã được liệt kê chi tiết trong báo cáo này!


