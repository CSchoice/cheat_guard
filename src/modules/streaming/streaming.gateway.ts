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
import { JwtService } from '@nestjs/jwt';

interface FramePayload {
  meta: { sessionId: string; examId: number; timestamp: number };
  buffer: ArrayBuffer;
}

@WebSocketGateway({
  namespace: '/api/stream',
  path: '/api/socket.io',
  cors: { origin: true, credentials: true },
})
export class StreamingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private clientSessions = new Map<
    string,
    { sessionId: string; examId: number; userId: number }
  >();

  constructor(
    private readonly analyzer: AnalyzerService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) return client.disconnect(true);

    let userId: number;
    try {
      const { sub } = this.jwtService.verify<{ sub: number }>(token);
      userId = sub;
    } catch {
      return client.disconnect(true);
    }

    const sessionId = client.handshake.query.sessionId as string;
    const examId = parseInt(client.handshake.query.examId as string, 10);
    if (!sessionId || isNaN(examId)) return client.disconnect(true);

    this.clientSessions.set(client.id, { sessionId, examId, userId });
    console.log(
      `[StreamingGateway] Connected: client=${client.id}, userId=${userId}, examId=${examId}, sessionId=${sessionId}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.clientSessions.delete(client.id);
    console.log('[StreamingGateway] Disconnected:', client.id);
  }

  @SubscribeMessage('frame')
  async handleFrame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: FramePayload,
  ) {
    const session = this.clientSessions.get(client.id);
    if (!session) return client.emit('error', { message: '세션 정보 없음' });

    const chunk = Buffer.from(payload.buffer);
    const result = await this.analyzer.analyzeFrame(
      chunk,
      session.sessionId,
      session.examId,
      session.userId,
    );
    client.emit('analysis', result);
  }
}
