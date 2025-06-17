import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AnalyzerService } from '../analyzer/analyzer.service';

@WebSocketGateway({ namespace: 'stream', cors: true })
export class StreamingGateway {
  @WebSocketServer()
  private server!: Server;

  constructor(private readonly analyzer: AnalyzerService) {}

  @SubscribeMessage('frame')
  async handleFrame(
    @MessageBody() chunk: Buffer,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const analysis = await this.analyzer.analyzeFrame(chunk);
      client.emit('analysis', analysis);
    } catch {
      client.emit('error', { message: '분석 중 오류가 발생했습니다.' });
    }
  }
}
