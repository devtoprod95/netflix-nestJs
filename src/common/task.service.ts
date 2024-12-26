import { Injectable } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { readdir, unlink } from "fs/promises";
import { join, parse } from "path"; 
import { Movie } from "src/movie/entity/movie.entity";
import { Repository } from "typeorm";

@Injectable()
export class taskService {
    constructor(
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>,
        private readonly schedulerRegistry: SchedulerRegistry,
    ){}

    logEverySecond(){
        console.log('1초마다 실행!');
    }
    
    // @Cron('* * * * * *')
    async eraseOrphanFiles(){
        const files = await readdir(join(process.cwd(), 'public', 'temp'));

        const deleteFilesTargets = files.filter((file) => {
            const filename = parse(file).name;
            const split = filename.split('_');

            if( split.length !== 2 ){
                return true;
            }

            try {
                const date = +new Date(parseInt(split.pop()));
                const aDayInMilSec = (24 * 60 * 60 * 1000); // 24시간 밀리세컨드
                
                const now = +new Date();

                return (now - date) > aDayInMilSec;
            } catch (error) {
                return true;
            }
        });

        await Promise.all(
            deleteFilesTargets.map(
                (x) => unlink(join(process.cwd(), 'public', 'temp', x))
            )
        );
    }

    // @Cron('0 * * * * *')
    async calculateMovieLikeCount(): Promise<void> {
        await this.movieRepository
            .createQueryBuilder()
            .update(Movie)
            .set({
                likeCount: () => `(
                    SELECT COUNT(*)
                    FROM movie_user_like mul
                    WHERE Movie.id = mul."movieId"
                    AND mul."isLike" = true
                )`
            })
            .execute();

        await this.movieRepository
            .createQueryBuilder()
            .update(Movie)
            .set({
                disLikeCount: () => `(
                    SELECT COUNT(*)
                    FROM movie_user_like mul
                    WHERE Movie.id = mul."movieId"
                    AND mul."isLike" = false
                )`
            })
            .execute();
    }

    // @Cron('* * * * * *', {
    //     name: 'printer'
    // })
    printer(){
        console.log('print every seconds');
    }

    // @Cron('*/5 * * * * *')
    stopper(){
        console.log('---stopper run---');

        const job = this.schedulerRegistry.getCronJob('printer');

        console.log('# Last Date');
        console.log(job.lastDate());
        console.log('# Next Date');
        console.log(job.nextDate());
        console.log('# Next Dates');
        console.log(job.nextDates(5));

        if(job.running){
            job.stop();
        }else{
            job.start();
        }
    }
}