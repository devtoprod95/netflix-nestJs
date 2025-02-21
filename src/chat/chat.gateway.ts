import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { BadGatewayException, UseInterceptors } from '@nestjs/common';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { WsQueryRunner } from 'src/common/decorator/ws-query-runner.decorator';
import { QueryRunner } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const rawToken = client.handshake.headers.authorization;
      const payload  = await this.authService.parseBearerToken(rawToken, false);

      if( !payload ){
        throw new BadGatewayException('토큰이 유효하지 않습니다.');
      }

      client.data.user = payload;
      this.chatService.registerClient(payload.sub, client);
      await this.chatService.joinUserRooms(payload, client);
    } catch (error) {
      console.log(error);
      client.disconnect();
    }
  }
  
  handleDisconnect(client: Socket) {
    const user = client.data.user;

    if( user ){
      this.chatService.removeClient(user.sub);
    }
  }

  @SubscribeMessage('receiveMessage')
  async receiveMessage(
    @MessageBody() data: {message: string},
    @ConnectedSocket() client: Socket,
  ){
    console.log('receiveMessage');
    console.log(data);
    console.log(client);
  }

  @SubscribeMessage('sendMessage')
  @UseInterceptors(WsTransactionInterceptor)
  async handleMessage(
    @MessageBody() body: CreateChatDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ){
    const payload = client.data.user;
    await this.chatService.createMessage(payload, body, qr);
  }
}
