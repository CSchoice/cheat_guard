// src/modules/auth/auth.controller.ts
import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { UserResponseDto } from '../users/dto/response/user-response.dto';
import { LoginUserPayloadClass } from 'src/common/guards/login-user-payload';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '로그인' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: 200,
    description: 'JWT 토큰 반환',
    type: LoginResponseDto,
  })
  @Post('login')
  @UseGuards(LocalAuthGuard)
  login(
    @Request() req: { user: LoginUserPayloadClass },
  ): Promise<LoginResponseDto> {
    return Promise.resolve(this.authService.login(req.user));
  }

  @ApiOperation({ summary: '내 정보 조회 (토큰 필요)' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: '인증된 사용자 정보 반환',
    type: UserResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @Post('me')
  getProfile(@Request() req: { user: UserResponseDto }): UserResponseDto {
    return req.user;
  }
}
