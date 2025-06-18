import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @ApiOperation({ summary: '서버 헬스 체크' })
  @ApiResponse({
    status: 200,
    description: '서버 헬스 체크 성공',
  })
  @Get()
  getHealth(): string {
    return 'OK';
  }
}
