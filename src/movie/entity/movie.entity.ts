import { Transform } from "class-transformer";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseTable } from "../../common/entity/base-table.entity";
import { MovieDetail } from "./movie-detail.entity";
import { Director } from "src/director/entity/director.entity";

@Entity()
export class Movie extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    title: string;

    @Column()
    @Transform(
        ({value}) => value.toString().toUpperCase()
    )
    genre: string;

    @OneToOne(
        () => MovieDetail,
        movieDetail => movieDetail.id,
        {
            cascade: true,
            nullable: false,
        }
    )
    @JoinColumn()
    detail: MovieDetail;

    @ManyToOne(
        () => Director,
        director => director.id,
        {
            cascade: true,
            nullable: false,
        }
    )
    director: Director
}