import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDTO {
  @IsString()
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}
