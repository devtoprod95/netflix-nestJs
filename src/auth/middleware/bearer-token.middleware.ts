import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { envVariableKeys } from "src/common/const/env.const";

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware{
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ){}

    async use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers['authorization'];

        if(!authHeader) return next();

        try {
            const token = this.validateBearerToken(authHeader);
            const tokenKey = `TOKEN_${token}`;

            const cachedPayload = await this.cacheManager.get(tokenKey);

            if(cachedPayload){
                req.user = cachedPayload;
                return next();
            }

            const decodePayload = this.jwtService.decode(token);

            if( !['refresh', 'access'].includes(decodePayload?.type) ){
                throw new UnauthorizedException('잘못된 토큰입니다.');
            };

            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>(
                    decodePayload.type === 'refresh' ? envVariableKeys.REFRESH_TOKEN_SECRET : envVariableKeys.ACCESS_TOKEN_SECRET
                ),
            });
            
            const expriryDate = +new Date(payload['exp'] * 1000);
            const now = +Date.now();

            const differenceInSeconds = (expriryDate - now) / 1000;
            await this.cacheManager.set(tokenKey, payload, Math.max((differenceInSeconds - 30) * 1000, 1));

            req.user = payload;
        } catch (error) {
            if( error.name === 'TokenExpiredError' ){
                throw new UnauthorizedException("토큰이 만료되었습니다.");
            }
        }
        return next();
    }

    validateBearerToken(rawToken: string){
        const basicSplit = rawToken.split(" ");
        if( basicSplit.length !== 2 ){
            throw new BadRequestException('토큰 포맷이 잘못됐습니다.');
        }

        const [basic, token] = basicSplit;
        if( basic.toLowerCase() !== 'bearer') {
            throw new BadRequestException('토큰 포맷이 잘못됐습니다.');
        }

        return token;
    }

}