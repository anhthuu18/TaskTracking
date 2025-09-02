import { IsEmail, IsString, MaxLength, MinLength, IsOptional, Matches } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @MaxLength(20)
  username: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  confirmPassword: string;

  @IsOptional()
  @Matches(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ.'
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
