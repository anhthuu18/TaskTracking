import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @IsInt()
  workspaceId: number;

  @IsString()
  @IsOptional()
  description?: string;
}
