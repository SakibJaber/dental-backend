import { IsOptional, IsString } from 'class-validator';

export class UpdateLegalPageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
