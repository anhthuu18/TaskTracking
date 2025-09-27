import { IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class AddMemberDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole = MemberRole.MEMBER;
}
