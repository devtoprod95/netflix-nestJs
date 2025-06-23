import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from '@prisma/client';
import { RBAC } from "../decorator/rbac.decorator";

@Injectable()
export class RBACGuard implements CanActivate{
    constructor(
        private readonly reflector: Reflector,
    ){}

    canActivate(context: ExecutionContext): boolean{
        const role = this.reflector.get<Role>(RBAC, context.getHandler());

        // Role enum에 해당되는 값이 데코레이터에 들어갔는지 확인하기
        if(!Object.values(Role).includes(role)){
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user    = request.user;

        if(!user){
            throw new UnauthorizedException('로그인이 필요합니다.');
        }

        const roleAccessLevel = {
            [Role.admin]: 0,
            [Role.paiduser]: 1,
            [Role.user]: 2,
        }

        if(roleAccessLevel[user.role] > roleAccessLevel[role]){
            throw new UnauthorizedException('접근 권한이 없습니다.');
        }
    
        return true;
    }
}