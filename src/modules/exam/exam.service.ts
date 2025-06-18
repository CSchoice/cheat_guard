import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QueryFailedError } from 'typeorm';
import {
  ConflictException,
  ExamValidationException,
  InternalServerErrorException,
  UserNotFoundException,
} from '../../common/exceptions/business.exception';
import { Exam, ExamStatus } from './entities/exam.entity';
import { CreateExamRequestDto } from './dto/request/create-exam.dto';
import { RegisterExamUserDto } from './dto/request/register-exam-user.dto';
import { ExamResponseDto } from './dto/response/exam-response.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/response/user-response.dto';
import { ExamParticipant } from './entities/exam-participant.entity';
import { ExamDetailResponseDto } from './dto/response/exam-detail-response.dto';
import { CheatingRecordEntity } from '../analyzer/entities/cheating-record.entity';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    @InjectRepository(Exam) private readonly examRepo: Repository<Exam>,
    @InjectRepository(ExamParticipant)
    private readonly examParticipantRepo: Repository<ExamParticipant>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(CheatingRecordEntity)
    private readonly cheatingRecordRepo: Repository<CheatingRecordEntity>,
  ) {}

  private validateExam(exam: Exam): void {
    if (exam.deadlineAt <= new Date()) {
      throw new ExamValidationException(
        '시험 마감 시간은 현재 시간 이후여야 합니다.',
      );
    }
    if (exam.title.length < 2 || exam.title.length > 50) {
      throw new ExamValidationException(
        '시험 제목은 2자 이상 50자 이하이어야 합니다.',
      );
    }
    if (!/^[a-zA-Z0-9ㄱ-ㅎ가-힣\s]+$/.test(exam.title)) {
      throw new ExamValidationException(
        '시험 제목은 한글, 영어, 숫자, 공백만 포함할 수 있습니다.',
      );
    }
    if (exam.title.includes('  ')) {
      throw new ExamValidationException(
        '시험 제목에 연속된 공백이 포함될 수 없습니다.',
      );
    }
    if (exam.title.trim() === '') {
      throw new ExamValidationException(
        '시험 제목은 공백만 포함할 수 없습니다.',
      );
    }
    if (exam.title.startsWith(' ') || exam.title.endsWith(' ')) {
      throw new ExamValidationException(
        '시험 제목은 양쪽 끝에 공백을 포함할 수 없습니다.',
      );
    }
    if (exam.title.includes('\n') || exam.title.includes('\r')) {
      throw new ExamValidationException(
        '시험 제목에 줄바꿈 문자가 포함될 수 없습니다.',
      );
    }
  }

  private toDto(exam: Exam, userId: number): ExamResponseDto {
    const dto = new ExamResponseDto();
    dto.id = exam.id;
    dto.title = exam.title;
    dto.deadlineAt = exam.deadlineAt;
    dto.isParticipating =
      exam.examParticipants?.some((ep) => ep.user.id === userId) ?? false;
    dto.isCompleted =
      exam.examParticipants?.some(
        (ep) => ep.user.id === userId && ep.isCompleted,
      ) ?? false;
    return dto;
  }

  private toOneDto(
    exam: Exam,
    userId: number,
    cheatingLogs: CheatingRecordEntity[],
  ): ExamDetailResponseDto {
    return {
      id: exam.id,
      title: exam.title,
      deadlineAt: exam.deadlineAt,
      isParticipating: exam.examParticipants.some((p) => p.user.id === userId),
      isCompleted:
        exam.examParticipants.find((p) => p.user.id === userId)?.isCompleted ??
        false,
      cheatingLogs: cheatingLogs.map((log) => ({
        detectedAt: log.detectedAt,
        reason: log.reason,
      })),
    };
  }

  async create(
    dto: CreateExamRequestDto,
    userId: number,
  ): Promise<ExamResponseDto> {
    const exam = this.examRepo.create({
      title: dto.title,
      deadlineAt: new Date(dto.deadlineAt),
      creatorId: userId,
    });

    this.validateExam(exam);

    try {
      const saved = await this.examRepo.save(exam);
      return this.toDto(saved, userId);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverErr = error.driverError as { code?: string };
        if (driverErr.code === '23505') {
          throw new ConflictException('이미 같은 제목의 시험이 존재합니다.');
        }
      }
      throw new InternalServerErrorException(
        '시험 생성 중 오류가 발생했습니다.',
      );
    }
  }

  async findAll(userId: number): Promise<ExamResponseDto[]> {
    const exams = await this.examRepo.find({
      relations: ['examParticipants', 'examParticipants.user'],
    });
    return exams.map((e) => this.toDto(e, userId));
  }

  async findOne(id: number, userId: number): Promise<ExamDetailResponseDto> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['examParticipants', 'examParticipants.user'],
    });

    if (!exam) {
      throw new UserNotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }

    const cheatingLogs = await this.cheatingRecordRepo.find({
      where: {
        examId: id,
        userId,
      },
      order: {
        detectedAt: 'ASC',
      },
    });

    return this.toOneDto(exam, userId, cheatingLogs);
  }

  async registerUser(
    id: number,
    dto: RegisterExamUserDto,
  ): Promise<ExamResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      const exam = await manager.findOne(Exam, {
        where: { id },
        relations: ['examParticipants', 'examParticipants.user'],
      });
      if (!exam) {
        throw new UserNotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
      }

      if (exam.examParticipants.some((ep) => ep.user.id === dto.userId)) {
        throw new ConflictException(
          `사용자(ID ${dto.userId})가 이미 등록되어 있습니다.`,
        );
      }

      const userEntity = await manager.findOne(User, {
        where: { id: dto.userId },
      });
      if (!userEntity) {
        throw new UserNotFoundException(
          `ID ${dto.userId} 번 사용자를 찾을 수 없습니다.`,
        );
      }

      const newParticipant = manager.create(ExamParticipant, {
        exam,
        user: userEntity,
        isCompleted: false,
      });
      await manager.save(newParticipant);

      const updatedExam = await manager.findOne(Exam, {
        where: { id },
        relations: ['examParticipants', 'examParticipants.user'],
      });

      return this.toDto(updatedExam!, dto.userId);
    });
  }

  async unregisterUser(id: number, userId: number): Promise<ExamResponseDto> {
    await this.examParticipantRepo.delete({
      exam: { id },
      user: { id: userId },
    });
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['examParticipants', 'examParticipants.user'],
    });
    if (!exam) {
      throw new UserNotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }
    return this.toDto(exam, userId);
  }

  async getParticipants(id: number): Promise<UserResponseDto[]> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['examParticipants', 'examParticipants.user'],
    });
    if (!exam) {
      throw new UserNotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }
    return exam.examParticipants.map((ep) => ({
      id: ep.user.id,
      nickname: ep.user.nickname,
    }));
  }

  async startExam(
    examId: number,
    userId: number,
  ): Promise<{ sessionId: string; fastApiUrl: string }> {
    const exam = await this.examRepo.findOne({
      where: { id: examId },
      relations: ['examParticipants', 'examParticipants.user'],
    });
    if (!exam) throw new UserNotFoundException('시험을 찾을 수 없습니다.');

    if (!exam.examParticipants.some((p) => p.user.id === userId)) {
      throw new ConflictException('시험에 참가하지 않은 사용자입니다.');
    }

    const timestamp = Date.now();
    const sessionId = `session_${examId}_${userId}_${timestamp}`;
    const fastApiUrl =
      this.configService.get<string>('fastApiUrl') || 'http://localhost:8000';

    return { sessionId, fastApiUrl };
  }

  async findMyExams(userId: number): Promise<ExamResponseDto[]> {
    const exams = await this.examRepo
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.examParticipants', 'ep')
      .leftJoinAndSelect('ep.user', 'user')
      .where('user.id = :userId', { userId })
      .getMany();

    return exams.map((e) => this.toDto(e, userId));
  }

  async endExam(id: number, userId: number): Promise<ExamResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      const exam = await manager.findOne(Exam, {
        where: { id },
        relations: ['examParticipants', 'examParticipants.user'],
      });

      if (!exam) {
        throw new UserNotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
      }

      const participation = await manager.findOne(ExamParticipant, {
        where: { exam: { id }, user: { id: userId } },
      });
      if (participation) {
        participation.isCompleted = true;
        await manager.save(participation);
      }

      return this.toDto(exam, userId);
    });
  }
}
