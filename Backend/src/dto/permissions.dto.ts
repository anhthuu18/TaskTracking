import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  permissionName: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  permissionName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
