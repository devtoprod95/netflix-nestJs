import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CursorPaginationDto } from "src/common/dto/cursor-pagination.dto";
import { PagePaginationDto } from "src/common/dto/page-pagination.dto";

export class GetMoviesDto extends CursorPaginationDto {

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: '영화 제목',
        example: '암수살인'
    })
    title?: string;
}