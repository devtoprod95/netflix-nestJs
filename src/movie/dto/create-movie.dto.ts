import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateMovieDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: '영화 제목',
        example: '겨울왕국'
    })
    title: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: '영화 설명',
        example: '재밌는 영화입니다.'
    })
    description: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: '감독 ID',
        example: "1"
    })
    directorId: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({
        each: true,
    })
    @Type(() => String)
    @ApiProperty({
        description: '장르 IDs',
        example: ["1", "2"]
    })
    genreIds: string[];

    @IsString()
    @ApiProperty({
        description: '영화 썸네일 파일',
        example: 'aaa-bbb-ccc-ddd.jpg'
    })
    thumbnail: string;
}