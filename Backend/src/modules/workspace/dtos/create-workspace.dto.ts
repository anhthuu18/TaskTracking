import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkspaceType } from '@prisma/client';

export class CreateWorkspaceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  workspaceName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(WorkspaceType)
  workspaceType: WorkspaceType;
}
