import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Tên người dùng phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên người dùng không được để trống' })
  @MaxLength(20, { message: 'Tên người dùng không được vượt quá 20 ký tự' })
  username: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Tên người dùng phải là chuỗi' })
  @MaxLength(20, { message: 'Tên người dùng không được vượt quá 20 ký tự' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;
}
