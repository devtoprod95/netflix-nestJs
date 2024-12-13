import { Exclude, Expose, Transform } from "class-transformer";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";

@Exclude() // 제외
@Entity()
export class Movie {
    @Expose()
    @PrimaryGeneratedColumn()
    id: number;

    @Expose()
    @Column()
    title: string;

    @Expose()
    @Column()
    @Transform(
        ({value}) => value.toString().toUpperCase()
    ) 
    genre: string;

    @CreateDateColumn()
    @Expose()
    createdAt: Date;

    @UpdateDateColumn()
    @Expose()
    updatedAt: Date;

    @VersionColumn()
    @Expose()
    version: number;
}