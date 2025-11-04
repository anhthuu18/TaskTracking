import { IsString, IsInt, MaxLength, Min, Max } from 'class-validator';

export class CreateTaskPriorityDto {
  @IsString()
  @MaxLength(50)
  priorityName: string;

  @IsInt()
  @Min(1)
  @Max(5)
  priorityLevel: number;
}


