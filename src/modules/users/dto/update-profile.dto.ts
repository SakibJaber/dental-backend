import { IsOptional, IsString, IsPhoneNumber, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber('GB', { message: 'Provide a valid phone number (E.164 preferred)' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  gdcNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  clinicName?: string;

}
