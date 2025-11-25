import { IsInt, IsOptional, IsDateString } from 'class-validator';

export class PomodoroStatisticsDto {
  id: number;
  taskId: number;
  userId: number;
  totalFocusTime: number; // in minutes
  totalBreakTime: number; // in minutes
  completedSessions: number;
  totalSessions: number;
  lastTrackedDate?: Date;
  dateCreated: Date;
  dateModified: Date;
}

export class UpdatePomodoroStatisticsDto {
  @IsInt()
  @IsOptional()
  totalFocusTime?: number;

  @IsInt()
  @IsOptional()
  totalBreakTime?: number;

  @IsInt()
  @IsOptional()
  completedSessions?: number;

  @IsInt()
  @IsOptional()
  totalSessions?: number;

  @IsDateString()
  @IsOptional()
  lastTrackedDate?: string;
}

