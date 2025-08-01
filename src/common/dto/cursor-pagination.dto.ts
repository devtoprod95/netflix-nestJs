import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class CursorPaginationDto {
    @IsString()
    @IsOptional()
    // id_52,likeCount_20
    // 52
    @ApiProperty({
        description: '페이지네이션 커서',
        example: 'eyJ2YWx1ZXMiOnsiaWQiOjF9LCJvcmRlciI6WyJpZF9kZXNjIl19'
    })
    cursor?: string;

    @IsArray()
    @IsString({
        each: true
    })
    @IsOptional()
    @ApiProperty({
        description: '내림차 또는 오름차 정렬',
        example: ['id_DESC']
    })
    @Transform(({value}) => Array.isArray(value) ? value : [value])
    // ['id_DESC', 'likeCount_ASC']
    order: string[] = ['id_DESC'];

    @IsInt()
    @IsOptional()
    @ApiProperty({
        description: '가져올 데이터 사이즈',
        example: 10
    })
    take: number = 2;
}