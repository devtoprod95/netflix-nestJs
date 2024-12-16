import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ){}

    parseBasicToken(rawToken: string){
        const basicSplit = rawToken.split(" ");
        if( basicSplit.length !== 2 ){
            throw new BadRequestException('토큰 포맷이 잘못됐습니다.');
        }

        const [_, token] = basicSplit;
        const decoded = Buffer.from(token, 'base64').toString('utf-8');

        const tokenSplit = decoded.split(':');
        if( tokenSplit.length !== 2 ){
            throw new BadRequestException('토큰 포맷이 잘못됐습니다.');
        }

        const [email, password] = tokenSplit;
        return {email, password};
    }

    async register(rawToken: string){
        const {email, password} = this.parseBasicToken(rawToken);

        const user = await this.userRepository.findOne({
            where: {
                email
            }
        });
        if( user ){
            throw new BadRequestException('이미 가입한 이메일 입니다.');
        }

        const hash = await bcrypt.hash(password, this.configService.get<number>('HASH_ROUNDS'))

        await this.userRepository.save({
            email,
            password: hash
        });

        return await this.userRepository.findOne({
            where: {
                email
            }
        });
    }
}
