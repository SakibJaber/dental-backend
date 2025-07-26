import {
  IsEmail,
  IsString,
  MinLength,
  Length,
  IsNumber,
} from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString() 
  resetToken: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
