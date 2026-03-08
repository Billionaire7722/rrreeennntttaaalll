import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    recipientId?: string;

    @IsOptional()
    @IsString()
    houseId?: string;

    @IsOptional()
    @IsString()
    houseTitle?: string;
}
