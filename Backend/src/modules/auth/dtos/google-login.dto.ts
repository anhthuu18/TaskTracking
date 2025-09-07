import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleLoginDTO {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

