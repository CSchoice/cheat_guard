// src/modules/exam/exam.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exam]), UsersModule],
  providers: [ExamService],
  controllers: [ExamController],
})
export class ExamModule {}
