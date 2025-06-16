import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.repo.find();
  }

  async create(nickname: string, plainPassword: string): Promise<User> {
    const salt: string = await bcrypt.genSalt();
    const password: string = await bcrypt.hash(plainPassword, salt);

    const user = this.repo.create({ nickname, password });
    return this.repo.save(user);
  }
}
