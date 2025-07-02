import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/response/user-response.dto';
import { NotFoundException } from '@nestjs/common';
import {
  ConflictException,
  ValidationException,
  InternalServerErrorException,
} from '../../common/exceptions/business.exception';
import {
  UserNotFoundException,
} from '../../common/exceptions/business.exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  /** 전체 사용자 조회 */
  async findAll(): Promise<UserResponseDto[]> {
    try {
      const users = await this.repo.find();
      return users.map((u) => ({ id: u.id, nickname: u.nickname }));
    } catch {
      throw new InternalServerErrorException({
        message: '사용자 목록 조회 중 오류가 발생했습니다.',
      });
    }
  }

  /** 단일 사용자 조회 */
  async findOne(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.repo.findOne({ where: { id } });
      if (!user) {
        throw new UserNotFoundException(id);
      }
      return { id: user.id, nickname: user.nickname };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: '사용자 조회 중 오류가 발생했습니다.',
      });
    }
  }

  /** 회원 가입 */
  async create(
    nickname: string,
    plainPassword: string,
  ): Promise<UserResponseDto> {
    if (!nickname || !plainPassword) {
      throw new ValidationException({
        field: 'credentials',
        message: '닉네임과 비밀번호는 필수입니다.',
      });
    }

    if (nickname.length < 2 || nickname.length > 50) {
      throw new ValidationException({
        field: 'nickname',
        message: '닉네임은 2자 이상 50자 이하이어야 합니다.',
      });
    }

    if (!/^[a-zA-Z0-9ㄱ-ㅎ가-힣\s]+$/.test(nickname)) {
      throw new ValidationException({
        field: 'nickname',
        message: '닉네임은 한글, 영어, 숫자, 공백만 포함할 수 있습니다.',
      });
    }

    if (nickname.includes('  ')) {
      throw new ValidationException({
        field: 'nickname',
        message: '닉네임에 연속된 공백이 포함될 수 없습니다.',
      });
    }

    if (nickname.trim() === '') {
      throw new ValidationException({
        field: 'nickname',
        message: '닉네임은 공백만 포함할 수 없습니다.',
      });
    }

    if (nickname.startsWith(' ') || nickname.endsWith(' ')) {
      throw new ValidationException({
        field: 'nickname',
        message: '닉네임은 양쪽 끝에 공백을 포함할 수 없습니다.',
      });
    }

    if (nickname.includes('\n') || nickname.includes('\r')) {
      throw new ValidationException({
        field: 'nickname',
        message: '닉네임에 줄바꿈 문자가 포함될 수 없습니다.',
      });
    }

    if (plainPassword.length < 6) {
      throw new ValidationException({
        field: 'password',
        message: '비밀번호는 최소 6자 이상이어야 합니다.',
      });
    }

    const exists = await this.repo.findOne({ where: { nickname } });
    if (exists) {
      throw new ConflictException('사용자', {
        nickname,
        message: '이미 사용 중인 닉네임입니다.'
      });
    }

    try {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash(plainPassword, salt);
      const user = this.repo.create({ nickname, password });
      const saved = await this.repo.save(user);
      return { id: saved.id, nickname: saved.nickname };
    } catch (error) {
      throw new InternalServerErrorException({
        message: '사용자 생성 중 오류가 발생했습니다.',
      });
    }
  }

  /** 로그인용: 닉네임으로 유저 엔티티 조회 */
  async findOneByNickname(nickname: string): Promise<User> {
    try {
      const user = await this.repo.findOne({ where: { nickname } });
      if (!user) {
        throw new UserNotFoundException(nickname);
      }
      return user;
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: '사용자 조회 중 오류가 발생했습니다.',
      });
    }
  }

  /** 로그인용: 평문 비밀번호와 해시된 비밀번호 비교 */
  async comparePassword(id: number, plainPassword: string): Promise<boolean> {
    const user = await this.findOneById(id);
    return bcrypt.compare(plainPassword, user.password);
  }

  /** 내부용: ID로 유저 조회 */
  private async findOneById(id: number): Promise<User> {
    try {
      const user = await this.repo.findOne({ where: { id } });
      if (!user) {
        throw new UserNotFoundException(id);
      }
      return user;
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: '사용자 조회 중 오류가 발생했습니다.',
      });
    }
  }
}
