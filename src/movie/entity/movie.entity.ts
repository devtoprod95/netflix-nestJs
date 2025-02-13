import { Transform } from "class-transformer";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseTable } from "../../common/entity/base-table.entity";
import { MovieDetail } from "./movie-detail.entity";
import { Director } from "src/director/entity/director.entity";
import { Genre } from "src/genre/entity/genre.entity";
import { User } from "src/user/entity/user.entity";
import { MovieUserLike } from "./movie-user-like.entity";

@Entity()
export class Movie extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
        () => User,
        (user) => user.createdMovies,
        {
            cascade: true,
            nullable: false,
        }
    )
    creator: User;

    @Column({
        unique: true,
    })
    title: string;

    @ManyToMany(
        () => Genre,
        genre => genre.movies,
    )
    @JoinTable()
    genres: Genre[];

    @Column({
        default: 0
    })
    likeCount: number;

    @Column({
        default: 0
    })
    disLikeCount: number;

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

    @Column()
    @Transform(({value}) => process.env.ENV === 'prod' ? `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${value}` : `http://localhost:3000/${value}`)
    thumbnail: string;

    @ManyToOne(
        () => Director,
        director => director.id,
        {
            cascade: true,
            nullable: false,
        }
    )
    @JoinColumn()
    director: Director

    @OneToMany(
        () => MovieUserLike,
        (mul) => mul.movie
    )
    likedUsers: MovieUserLike[]
}