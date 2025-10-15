import { IsString, MinLength, NotEquals } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @NotEquals('currentPassword', { message: 'New password must be different' })
  newPassword: string;
}
