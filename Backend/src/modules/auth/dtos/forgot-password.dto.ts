import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class ForgotPasswordDTO {
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ (VD: 0987654321 hoặc +84987654321)',
  })
  phone: string;
}

export class VerifyOtpDTO {
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;

  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString({ message: 'Mã OTP phải là chuỗi' })
  @Length(4, 6, { message: 'Mã OTP phải có 4-6 ký tự' })
  @Matches(/^\d+$/, { message: 'Mã OTP chỉ được chứa số' })
  otpCode: string;
}

export class ResetPasswordDTO {
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;

  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @Length(6, 50, { message: 'Mật khẩu mới phải có 6-50 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số',
  })
  newPassword: string;

  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi' })
  confirmPassword: string;
}
