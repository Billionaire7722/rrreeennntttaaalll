import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleFavoriteDto {
    @IsNotEmpty()
    @IsString()
    houseId: string;
}
