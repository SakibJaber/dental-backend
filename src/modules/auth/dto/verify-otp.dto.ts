import { IsEmail, IsNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsNumber()
  @Length(6, 6)
  code: number
}
