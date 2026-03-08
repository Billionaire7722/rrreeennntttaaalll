import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    loginId: string; // Can be email or username

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    captchaToken?: string;
}
