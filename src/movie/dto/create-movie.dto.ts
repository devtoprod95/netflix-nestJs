import { IsNotEmpty } from "class-validator";

export class CreateMovieDto {
    @IsNotEmpty()
    title: string;

    @IsNotEmpty()
    genre: string;

    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    directorId: number;
}