import { IsString, IsOptional } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  projectName?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
