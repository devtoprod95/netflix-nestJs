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

    async applyCursorPaginationParamsToQb<T>(qb: SelectQueryBuilder<T>, dto: CursorPaginationDto): Promise<{
        qb: SelectQueryBuilder<T>
        nextCursor: string | null}>
    {
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

        const results    = await qb.getMany();
        const nextCursor = this.generateNextCursor(results, order);

        return {qb, nextCursor};
    }

    generateNextCursor<T>(results: T[], order: string[]): string | null{
        if(results.length === 0) return null;

        /**
         * {
         *  values: {
         *      id: 1
         *  },
         *  order: ['id_DESC']
         * }
         * 
         */
        const lastItem = results[results.length - 1];
        const values   = {};

        order.forEach((columnOrder) => {
            const [column] = columnOrder.split('_');
            values[column] = lastItem[column];
        });

        const cursorObj = {values, order};
        const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');

        return nextCursor;
    }
}