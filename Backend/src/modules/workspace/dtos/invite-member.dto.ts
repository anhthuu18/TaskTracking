import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InviteType } from '@prisma/client';

export class InviteMemberDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(InviteType)
  inviteType: InviteType;

  @IsOptional()
  @IsString()
  message?: string;
}
