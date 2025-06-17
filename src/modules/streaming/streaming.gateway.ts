// src/streaming/streaming.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AnalyzerService } from '../analyzer/analyzer.service';

@WebSocketGateway({
  namespace: '/api/stream',
  path: '/api/socket.io',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class StreamingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(private readonly analyzer: AnalyzerService) {}

  // 클라이언트가 연결되었을 때
  handleConnection(client: Socket) {
    console.log('[StreamingGateway] client connected →', client.id);
  }

  // 클라이언트 연결이 해제되었을 때
  handleDisconnect(client: Socket) {
    console.log('[StreamingGateway] client disconnected ←', client.id);
  }

  @SubscribeMessage('frame')
  async handleFrame(
    @MessageBody() chunk: Buffer,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    console.log(
      '[StreamingGateway] frame received from',
      client.id,
      'at',
      new Date().toISOString(),
    );
    try {
      const result = await this.analyzer.analyzeFrame(chunk);
      console.log(
        '[StreamingGateway] analysis result for',
        client.id,
        ':',
        result,
      );
      client.emit('analysis', result);
    } catch (err) {
      console.error(
        '[StreamingGateway] analyze error for',
        client.id,
        err,
      );
      client.emit('error', {
        message: '분석 중 오류 발생',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
