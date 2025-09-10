import { IsEmail, IsString, MaxLength, MinLength, IsOptional, Matches, Length, IsNotEmpty } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @MaxLength(20)
  username: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số',
  })
  @Length(6, 50, { message: 'Mật khẩu phải có 6-50 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi' })
  confirmPassword: string;

  @IsOptional()
  @Matches(/^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ (VD: 0987654321, +84987654321)'
  })
  phone?: string;
}

// Interface để tạo user trong database (không có confirmPassword)
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  phone?: string;
}
