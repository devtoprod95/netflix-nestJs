import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/common/prisma.sevice';
import { Role, User } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        // @InjectRepository(User)
        // private readonly userRepository: Repository<User>,
        private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
        private readonly prisma: PrismaService
    ){}

    parseBasicToken(rawToken: string){
        const basicSplit = rawToken.split(" ");
        if( basicSplit.length !== 2 ){
            throw new BadRequestException('토큰 포맷이 잘못됐습니다.');
        }

        const [basic, token] = basicSplit;
        if( basic.toLowerCase() !== 'basic') {
            throw new BadRequestException('토큰 포맷이 잘못됐습니다.');
        }

        const decoded = Buffer.from(token, 'base64').toString('utf-8');

        const tokenSplit = decoded.split(':');
        if( tokenSplit.length !== 2 ){
            throw new BadRequestException('토큰 포맷이 잘못됐습니다.');
        }

        const [email, password] = tokenSplit;
        return {email, password};
    }

    async register(rawToken: string) {
        const {email, password} = this.parseBasicToken(rawToken);

        return await this.userService.create({email, password});
    }

    async authenticate(email: string, password: string){
        const user = await this.prisma.user.findUnique({
            where: {
                email
            },
            omit: {
                password: false
            }
        });
        
        // const user = await this.userRepository.findOne({
        //     where: {
        //         email
        //     }
        // });
        if( !user ){
            throw new BadRequestException('잘못된 로그인 정보입니다.');
        }

        const passOk = await bcrypt.compare(password, user.password);
        if(!passOk){
            throw new BadRequestException('잘못된 로그인 정보입니다.');
        }

        return user;
    }

    async issueToken(user: {id: number, role: Role}, isRefreshToken: boolean){
        const refreshTokenSecret = this.configService.get<string>(envVariableKeys.REFRESH_TOKEN_SECRET);
        const accressTokenSecret = this.configService.get<string>(envVariableKeys.ACCESS_TOKEN_SECRET);

        return await this.jwtService.signAsync({
            sub: user.id,
            role: user.role,
            type: isRefreshToken ? 'refresh' : 'access'
        }, {
            secret: isRefreshToken ? refreshTokenSecret : accressTokenSecret,
            expiresIn: isRefreshToken ? '24h' : 30000 // 300초 5분
        })
    }

    async login(rawToken: string){
        const {email, password} = this.parseBasicToken(rawToken);

        const user = await this.authenticate(email, password);
        return {
            refreshToken: await this.issueToken(user, true),
            accessToken: await this.issueToken(user, false),
        }
    }

    async tokenBlock(token: string): Promise<boolean> {
        const payload = this.jwtService.decode(token);

        const expriryDate = +new Date(payload['exp'] * 1000);
        const now = +Date.now();

        const differenceInSeconds = (expriryDate - now) / 1000;
        await this.cacheManager.set(`BLOCK_TOKEN_${token}`, payload, Math.max(differenceInSeconds * 1000, 1));

        return true;
    }

    async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
        const basicSplit = rawToken.split(' ');

        if (basicSplit.length !== 2) {
            throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
        }

        const [bearer, token] = basicSplit;

        if (bearer.toLowerCase() !== 'bearer') {
            throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>(
                    isRefreshToken ? envVariableKeys.REFRESH_TOKEN_SECRET : envVariableKeys.ACCESS_TOKEN_SECRET,
                ),
            });

            if (isRefreshToken) {
                if (payload.type !== 'refresh') {
                    throw new BadRequestException('Refresh 토큰을 입력 해주세요!');
                }
            } else {
                if (payload.type !== 'access') {
                    throw new BadRequestException('Access 토큰을 입력 해주세요!')
                }
            }

            return payload;
        } catch (e) {
            throw new UnauthorizedException('토큰이 만료됐습니다!');
        }
    }

}
