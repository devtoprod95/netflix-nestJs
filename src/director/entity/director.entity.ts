import { Movie } from "src/movie/entity/movie.entity";
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Director extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    dob: Date;

    @Column()
    nationality: string;

    @OneToMany(
        () => Movie,
        movie => movie.director,
    )
    movies: Movie[];
}
