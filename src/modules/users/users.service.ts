import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/response/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.repo.find();
    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
    }));
  }

  async create(
    nickname: string,
    plainPassword: string,
  ): Promise<UserResponseDto> {
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(plainPassword, salt);
    const user = this.repo.create({ nickname, password });
    const saved = await this.repo.save(user);
    return {
      id: saved.id,
      nickname: saved.nickname,
    };
  }
}
