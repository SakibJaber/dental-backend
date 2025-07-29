import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateLegalPageDto {
  @IsEnum(['about', 'terms', 'privacy'])
  slug: 'about' | 'terms' | 'privacy';

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
