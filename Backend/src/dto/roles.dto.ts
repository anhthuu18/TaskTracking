import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'Tên role phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên role không được để trống' })
  @MaxLength(20, { message: 'Tên role không được vượt quá 20 ký tự' })
  roleName: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MaxLength(255, { message: 'Mô tả không được vượt quá 255 ký tự' })
  description?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: 'Tên role phải là chuỗi' })
  @MaxLength(20, { message: 'Tên role không được vượt quá 20 ký tự' })
  roleName?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MaxLength(255, { message: 'Mô tả không được vượt quá 255 ký tự' })
  description?: string;
}
