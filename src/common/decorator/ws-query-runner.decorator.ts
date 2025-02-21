import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";

export const WsQueryRunner = createParamDecorator(
    (data: any, context: ExecutionContext) => {
        const client = context.switchToWs().getClient();

        if(!client || !client.data || !client.data.queryRunner){
            throw new WsException('Query Runner 객체를 찾을 수 없습니다.');
        }

        return client.data.queryRunner;
    }
)