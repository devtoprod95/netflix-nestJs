import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { BadGatewayException } from '@nestjs/common';

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

      if( payload ){
        client.data.user = payload;
      } else {
        throw new BadGatewayException('토큰이 유효하지 않습니다.');
      }

    } catch (error) {
      console.log(error);
      client.disconnect();
    }
  }
  
  handleDisconnect(client: Socket) {
    return;
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
  async sendMessage(
    @MessageBody() data: {message: string},
    @ConnectedSocket() client: Socket
  ){
    client.emit('sendMessage', {
      ...data,
      from: 'server'
    });
  }
}
