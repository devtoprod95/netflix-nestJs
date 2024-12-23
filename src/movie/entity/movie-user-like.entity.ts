import { User } from "src/user/entity/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Movie } from "./movie.entity";

@Entity()
export class MovieUserLike {
    @PrimaryColumn({
        name: 'movieId',
        type: 'int8'
    })
    movieId: number;

    @PrimaryColumn({
        name: 'userId',
        type: 'int8'
    })
    userId: number;

    @ManyToOne(
        () => Movie,
        (movie) => movie.likedUsers,
        {
            onDelete: 'CASCADE'
        }
    )
    movie: Movie;

    @ManyToOne(
        () => User,
        (user) => user.likedMovies,
        {
            onDelete: 'CASCADE'
        }
    )
    user: User;

    @Column()
    isLike: boolean
}