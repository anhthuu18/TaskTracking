import { IsString, IsOptional, IsInt, IsDateString, IsBoolean, MaxLength, Min, Max } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  taskName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  projectId: number;

  @IsOptional()
  @IsInt()
  assignedTo?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number; // 1-5, default 3

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string; // Default 'todo'

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number; // Estimated time to complete task in minutes

  @IsOptional()
  @IsString()
  @MaxLength(20)
  type?: string; // Default 'basic'

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recurringRule?: string;
}


