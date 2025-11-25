import { IsInt, IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { SessionTypeDto } from './create-time-tracking-session.dto';

export class UpdateTimeTrackingSessionDto {
  @IsEnum(SessionTypeDto)
  @IsOptional()
  sessionType?: SessionTypeDto;

  @IsInt()
  @IsOptional()
  duration?: number; // in minutes

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}

