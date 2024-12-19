import { BadRequestException, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { envVariableKeys } from "src/common/const/env.const";

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware{
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ){}

    async use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers['authorization'];

        if(!authHeader) return next();

        try {
            const token = this.validateBearerToken(authHeader);
            const decodePayload = this.jwtService.decode(token);

            if( !['refresh', 'access'].includes(decodePayload?.type) ){
                throw new UnauthorizedException('잘못된 토큰입니다.');
            };

            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>(
                    decodePayload.type === 'refresh' ? envVariableKeys.REFRESH_TOKEN_SECRET : envVariableKeys.ACCESS_TOKEN_SECRET
                ),
            });
    
            req.user = payload;
        } catch (error) {
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