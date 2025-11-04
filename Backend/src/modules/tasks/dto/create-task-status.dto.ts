import { IsString, IsOptional, IsInt, MaxLength, Min } from 'class-validator';

export class CreateTaskStatusDto {
  @IsString()
  @MaxLength(50)
  statusName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsInt()
  @Min(0)
  sortOrder: number;
}


