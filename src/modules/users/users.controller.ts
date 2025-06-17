import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserRequestDto } from './dto/request/create-user.dto';
import { UserResponseDto } from './dto/response/user-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '전체 사용자 조회 (관리자 전용)' })
  @ApiResponse({
    status: 200,
    description: '사용자 목록 반환',
    type: UserResponseDto,
    isArray: true,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @Get()
  async getAll(): Promise<UserResponseDto[]> {
    return await this.usersService.findAll();
  }

  @ApiOperation({ summary: '새 사용자 생성 (회원가입)' })
  @ApiBody({
    description: '생성할 사용자 정보',
    type: CreateUserRequestDto,
    schema: { example: { nickname: 'choi123', password: 'Abcd1234!' } },
  })
  @ApiResponse({
    status: 201,
    description: '생성된 사용자 반환',
    type: UserResponseDto,
  })
  @Post()
  async create(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
    return await this.usersService.create(dto.nickname, dto.password);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '단일 사용자 조회 (본인 또는 관리자)' })
  @ApiResponse({
    status: 200,
    description: '단일 사용자 반환',
    type: UserResponseDto,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student', 'self')
  @Get(':id')
  async getOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return await this.usersService.findOne(id);
  }
}
