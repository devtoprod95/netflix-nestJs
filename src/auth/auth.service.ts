import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
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

    async authenticate(email: string, password: string){
        const user = await this.userRepository.findOne({
            where: {
                email
            }
        });
        if( !user ){
            throw new BadRequestException('잘못된 로그인 정보입니다.');
        }

        const passOk = await bcrypt.compare(password, user.password);
        if(!passOk){
            throw new BadRequestException('잘못된 로그인 정보입니다.');
        }

        return user;
    }

    async login(rawToken: string){
        const {email, password} = this.parseBasicToken(rawToken);

        const user = await this.authenticate(email, password);

        const refreshTokenSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
        const accressTokenSecret = this.configService.get<string>('ACCESS_TOKEN_SECRET');
        return {
            refreshToken: await this.jwtService.signAsync({
                sub: user.id,
                role: user.role,
                type: 'refresh'
            }, {
                secret: refreshTokenSecret,
                expiresIn: '24h'
            }),
            accessToken: await this.jwtService.signAsync({
                sub: user.id,
                role: user.role,
                type: 'access'
            }, {
                secret: accressTokenSecret,
                expiresIn: 300 // 300초 5분
            }),
        }
        
    }
}
