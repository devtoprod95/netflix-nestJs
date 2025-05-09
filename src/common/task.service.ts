import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { readdir, unlink } from "fs/promises";
import { join, parse } from "path"; 
import { Movie } from "src/movie/entity/movie.entity";
import { Repository } from "typeorm";
import { Logger } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class TaskService {
    // private readonly logger = new Logger(taskService.name);

    constructor(
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>,
        private readonly schedulerRegistry: SchedulerRegistry,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ){}

    // @Cron('*/30 * * * * *')
    logEverySecond(){
        this.logger.fatal('FATAL 레벨 로그', null, TaskService.name);
        this.logger.error('ERROR 레벨 로그', null, TaskService.name);
        this.logger.warn('WARN 레벨 로그', TaskService.name);
        this.logger.log('LOG 레벨 로그', TaskService.name);
        this.logger.debug('DEBUG 레벨 로그', TaskService.name);
        this.logger.verbose('VERBOSE 레벨 로그', TaskService.name);
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