import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  targetId: string; // User ID or Property ID

  @IsEnum(['USER', 'PROPERTY'])
  type: 'USER' | 'PROPERTY';

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  details?: string;
}
