import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/response/user-response.dto';
import {
  ConflictException,
  InternalServerErrorException,
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
      throw new InternalServerErrorException(
        '사용자 목록 조회 중 오류가 발생했습니다.',
      );
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
      throw new InternalServerErrorException(
        '사용자 조회 중 오류가 발생했습니다.',
      );
    }
  }

  /** 회원 가입 */
  async create(
    nickname: string,
    plainPassword: string,
  ): Promise<UserResponseDto> {
    const exists = await this.repo.findOne({ where: { nickname } });
    if (exists) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }

    try {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash(plainPassword, salt);
      const user = this.repo.create({ nickname, password });
      const saved = await this.repo.save(user);
      return { id: saved.id, nickname: saved.nickname };
    } catch {
      throw new InternalServerErrorException(
        '사용자 생성 중 오류가 발생했습니다.',
      );
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
      throw new InternalServerErrorException(
        '사용자 조회 중 오류가 발생했습니다.',
      );
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
      throw new InternalServerErrorException(
        '사용자 조회 중 오류가 발생했습니다.',
      );
    }
  }
}
