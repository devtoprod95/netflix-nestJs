import { BadRequestException, Injectable } from "@nestjs/common";
import { SelectQueryBuilder } from "typeorm";
import { PagePaginationDto } from "./dto/page-pagination.dto";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";

@Injectable()
export class CommonService {
    constructor(){}

    applyPagePaginationParamsToQb<T>(qb: SelectQueryBuilder<T>, dto: PagePaginationDto): void {
        const {page, take} = dto;
        const skip = (page -1) * take;
        qb.take(take).skip(skip);
    }

    applyCursorPaginationParamsToQb<T>(qb: SelectQueryBuilder<T>, dto: CursorPaginationDto): void {
        const {cursor, take, order} = dto;

        if( cursor ){

        }
        
        for (let i = 0; i < order.length; i++) {
            const [column, direction] = order[i].split("_");
            const upperDirection = direction.toUpperCase() as 'ASC' | 'DESC';

            if( !['ASC', 'DESC'].includes(upperDirection) ){
                throw new BadRequestException('order는 ASC 또는 DESC로만 입력해주세요.');
            }

            if( i === 0 ){
                qb.orderBy(`${qb.alias}.${column}`, upperDirection);
            } else {
                qb.addOrderBy(`${qb.alias}.${column}`, upperDirection);
            }
        }

        qb.take(take);
    }
}