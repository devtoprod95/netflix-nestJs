import { Transform } from "class-transformer";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseTable } from "./base-table.entity";
import { MovieDetail } from "./movie-detail.entity";

@Entity()
export class Movie extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    @Transform(
        ({value}) => value.toString().toUpperCase()
    )
    genre: string;

    @OneToOne(
        () => MovieDetail
    )
    @JoinColumn()
    detail: MovieDetail;
}