import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;
}
