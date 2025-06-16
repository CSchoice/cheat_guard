// src/modules/users/users.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserRequestDto } from './dto/request/create-user.dto';
import { UserResponseDto } from './dto/response/user-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '전체 사용자 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 목록 반환',
    type: UserResponseDto,
    isArray: true,
  })
  @Get()
  getAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: '새 사용자 생성' })
  @ApiBody({
    description: '생성할 사용자 정보',
    type: CreateUserRequestDto,
    schema: {
      example: {
        nickname: 'choi123',
        password: 'Abcd1234!',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '생성된 사용자 반환',
    type: UserResponseDto,
  })
  @Post()
  create(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
    return this.usersService.create(dto.nickname, dto.password);
  }
}
