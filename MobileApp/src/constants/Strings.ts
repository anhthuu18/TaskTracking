// String constants for the application
export const Strings = {
  // App
  appName: 'AI Task Tracking',
  appSlogan: 'Quản lý công việc thông minh',

  // Common
  loading: 'Đang tải...',
  refresh: 'Làm mới',
  cancel: 'Hủy',
  save: 'Lưu',
  edit: 'Chỉnh sửa',
  delete: 'Xóa',
  add: 'Thêm',
  back: 'Quay lại',
  done: 'Hoàn thành',
  retry: 'Thử lại',

  // Task List Screen
  taskListTitle: 'Quản lý Công việc',
  searchPlaceholder: 'Tìm kiếm task...',
  addTask: 'Thêm Task',
  noTasks: 'Không tìm thấy task nào',
  noTasksSubtext: 'Thử thay đổi bộ lọc hoặc thêm task mới',

  // Task Status
  statusAll: 'Tất cả',
  statusTodo: 'Cần làm',
  statusInProgress: 'Đang làm',
  statusDone: 'Hoàn thành',
  statusCancelled: 'Đã hủy',

  // Task Priority
  priorityLow: 'Thấp',
  priorityMedium: 'Trung bình',
  priorityHigh: 'Cao',
  priorityUrgent: 'Khẩn cấp',

  // Task Detail
  taskDetail: 'Chi tiết Task',
  title: 'Tiêu đề',
  description: 'Mô tả',
  status: 'Trạng thái',
  priority: 'Độ ưu tiên',
  assignee: 'Người thực hiện',
  dueDate: 'Hạn hoàn thành',
  createdAt: 'Ngày tạo',
  updatedAt: 'Ngày cập nhật',
  tags: 'Thẻ',

  // Splash Screen
  splashLoading: 'Đang khởi động...',

  // Onboarding
  onboardingTitle1: 'Chào mừng !!!',
  onboardingSubtitle1:
    'Bạn có muốn hoàn thành task siêu nhanh với AT Tracking?',
  onboardingTitle2: 'Sắp xếp công việc dễ dàng',
  onboardingSubtitle2:
    'Dễ dàng sắp xếp thứ tự công việc để bạn quản lý. Nhiều chức năng để lựa chọn.',
  onboardingTitle3: 'Hoàn thành task dễ dàng hơn',
  onboardingSubtitle3:
    'Nó đã trở nên dễ dàng hơn để hoàn thành các task. Bắt đầu với chúng tôi!',
  skip: 'Bỏ qua',
  next: 'Tiếp theo',
  getStarted: 'Bắt đầu',

  // Authentication
  signUp: 'Đăng ký',
  signIn: 'Đăng nhập',
  username: 'Tên người dùng',
  password: 'Mật khẩu',
  confirmPassword: 'Xác nhận mật khẩu',
  email: 'Email',
  phone: 'Số điện thoại',
  forgotPassword: 'Quên mật khẩu?',
  orSignUpWith: 'Hoặc đăng ký với',
  orSignInWith: 'Hoặc đăng nhập với',
  alreadyHaveAccount: 'Đã có tài khoản?',
  dontHaveAccount: 'Chưa có tài khoản?',

  // Forgot Password Flow
  forgotPasswordTitle: 'Quên mật khẩu ?',
  forgotPasswordInstructions:
    'Nhập số điện thoại của bạn, chúng tôi sẽ gửi mã OTP qua SMS để đặt lại mật khẩu mới.',
  enterPhoneNumber: 'Nhập số điện thoại',
  sendOTP: 'Gửi OTP',
  sendingOTP: 'Đang gửi...',
  otpSentSuccess: 'Mã OTP đã được gửi đến số điện thoại của bạn',

  // OTP Screen
  enterOTPTitle: 'Nhập OTP',
  enterOTPInstructions:
    'Nhập mã OTP chúng tôi vừa gửi đến số điện thoại của bạn để bắt đầu đặt lại mật khẩu mới.',
  resendOTP: 'Gửi lại OTP',
  resendOTPTimer: 'Gửi lại OTP trong {time}s',
  nextButton: 'Tiếp theo',
  verifyingOTP: 'Đang xác thực...',
  otpVerificationSuccess: 'Xác thực OTP thành công',
  otpInvalid: 'Mã OTP không đúng. Vui lòng thử lại.',

  // Reset Password Screen
  resetPasswordTitle: 'Đặt lại mật khẩu mới',
  newPassword: 'Mật khẩu mới',
  confirmNewPassword: 'Xác nhận mật khẩu mới',
  saveChanges: 'Lưu thay đổi',
  savingChanges: 'Đang lưu...',
  resetPasswordSuccess: 'Đặt lại mật khẩu thành công!',
  resetPasswordError: 'Không thể đặt lại mật khẩu. Vui lòng thử lại.',

  // Validation Errors
  errorRequired: 'Trường này là bắt buộc',
  errorUsernameRequired: 'Tên người dùng là bắt buộc',
  errorUsernameMinLength: 'Tên người dùng phải có ít nhất 3 ký tự',
  errorUsernameInvalid:
    'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới',
  errorPasswordRequired: 'Mật khẩu là bắt buộc',
  errorPasswordMinLength: 'Mật khẩu phải có ít nhất 6 ký tự',
  errorPasswordWeak:
    'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  errorConfirmPasswordRequired: 'Xác nhận mật khẩu là bắt buộc',
  errorPasswordMismatch: 'Mật khẩu xác nhận không khớp',
  errorEmailInvalid: 'Email không hợp lệ',
  errorPhoneInvalid: 'Số điện thoại không hợp lệ',

  // General Errors
  errorGeneral: 'Đã xảy ra lỗi',
  errorNetwork: 'Lỗi kết nối mạng',
  errorNotFound: 'Không tìm thấy',
  errorUnauthorized: 'Không có quyền truy cập',
};
