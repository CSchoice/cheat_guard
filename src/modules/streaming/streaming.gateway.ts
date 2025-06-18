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

interface FramePayload {
  meta: {
    sessionId: string;
    examId: number;
    timestamp: number;
  };
  buffer: ArrayBuffer;
}

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

  // client.id → 세션 정보 매핑
  private clientSessions = new Map<
    string,
    { sessionId: string; examId: number; userId: number }
  >();

  constructor(private readonly analyzer: AnalyzerService) {}

  // 클라이언트가 연결되었을 때
  handleConnection(client: Socket) {
    console.log('[StreamingGateway] Handshake query:', client.handshake.query);

    // query 에서 sessionId, examId, userId 꺼내기
    const sessionId =
      (client.handshake.query.sessionId as string) || `sess-${client.id}`;
    const examId = parseInt(client.handshake.query.examId as string, 10) || 0;
    const userId = parseInt(client.handshake.query.userId as string, 10) || 0;

    this.clientSessions.set(client.id, {
      sessionId,
      examId,
      userId,
    });

    console.log(
      `[StreamingGateway] client connected → id=${client.id}, sessionId=${sessionId}, examId=${examId}, userId=${userId}`,
    );
  }

  // 클라이언트 연결 해제
  handleDisconnect(client: Socket) {
    console.log('[StreamingGateway] client disconnected ←', client.id);
    this.clientSessions.delete(client.id);
  }

  // 프레임 수신
  @SubscribeMessage('frame')
  async handleFrame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: FramePayload,
  ): Promise<void> {
    const { meta, buffer } = payload;
    console.log(
      `[StreamingGateway] frame received → client=${client.id}, examId=${meta.examId}, time=${new Date(
        meta.timestamp,
      ).toISOString()}`,
    );

    try {
      // buffer(ArrayBuffer) → Buffer 로 변환
      const chunk = Buffer.from(buffer);

      // analyzer 호출
      const result = await this.analyzer.analyzeFrame(
        chunk,
        meta.sessionId,
        meta.examId,
        this.clientSessions.get(client.id)?.userId ?? 0,
      );

      console.log(
        `[StreamingGateway] analysis result → client=${client.id}:`,
        result,
      );

      client.emit('analysis', result);
    } catch (err) {
      console.error('[StreamingGateway] analyze error for', client.id, err);
      client.emit('error', {
        message: '분석 중 오류 발생',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
