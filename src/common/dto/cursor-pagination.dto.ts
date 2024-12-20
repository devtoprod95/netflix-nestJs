import { IsIn, IsInt, IsOptional } from "class-validator";

export class CursorPaginationDto {
    @IsInt()
    @IsOptional()
    id: number;

    @IsIn(['ASC', 'DESC'])
    @IsOptional()
    order: 'ASC' | 'DESC' = 'ASC';

    @IsInt()
    @IsOptional()
    take: number = 10;
}