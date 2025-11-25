import { IsInt, IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export enum SessionTypeDto {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
}

export class CreateTimeTrackingSessionDto {
  @IsInt()
  @IsNotEmpty()
  taskId: number;

  @IsEnum(SessionTypeDto)
  @IsNotEmpty()
  sessionType: SessionTypeDto;

  @IsInt()
  @IsNotEmpty()
  duration: number; // in minutes

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsOptional()
  isCompleted?: boolean;
}

