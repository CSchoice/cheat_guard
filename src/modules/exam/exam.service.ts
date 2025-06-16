import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Exam, ExamStatus } from './entities/exam.entity';
import { CreateExamRequestDto } from './dto/request/create-exam.dto';
import { RegisterExamUserDto } from './dto/request/register-exam-user.dto';
import { ExamResponseDto } from './dto/response/exam-response.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/response/user-response.dto';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    @InjectRepository(Exam) private readonly examRepo: Repository<Exam>,
    private readonly usersService: UsersService,
  ) {}

  /** Entity → DTO 변환 */
  private toDto(exam: Exam): ExamResponseDto {
    const dto = new ExamResponseDto();
    dto.id = exam.id;
    dto.title = exam.title;
    dto.status = exam.status;
    dto.startedAt = exam.startedAt;
    dto.endedAt = exam.endedAt;
    dto.participants = exam.participants.map(
      (u) => ({ id: u.id, nickname: u.nickname }) as UserResponseDto,
    );
    return dto;
  }

  /** 시험 생성 */
  async create(dto: CreateExamRequestDto): Promise<ExamResponseDto> {
    const exam = this.examRepo.create({
      title: dto.title,
      startedAt: new Date(dto.startAt),
      endedAt: new Date(dto.endAt),
    });
    try {
      const saved = await this.examRepo.save(exam);
      return this.toDto(saved);
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

  /** 모든 시험 조회 */
  async findAll(): Promise<ExamResponseDto[]> {
    const exams = await this.examRepo.find({ relations: ['participants'] });
    return exams.map((e) => this.toDto(e));
  }

  /** 단일 시험 조회 */
  async findOne(id: number): Promise<ExamResponseDto> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!exam) {
      throw new NotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }
    return this.toDto(exam);
  }

  /** 참가자 등록 */
  async registerUser(
    id: number,
    dto: RegisterExamUserDto,
  ): Promise<ExamResponseDto> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!exam) {
      throw new NotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }

    if (exam.participants.some((u) => u.id === dto.userId)) {
      throw new ConflictException(
        `사용자(ID ${dto.userId})가 이미 등록되어 있습니다.`,
      );
    }

    let userEntity: User;
    try {
      userEntity = await this.usersService['findOneById'](dto.userId);
    } catch (err: unknown) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(
        '사용자 조회 중 오류가 발생했습니다.',
      );
    }

    exam.participants.push(userEntity);

    try {
      const updated = await this.examRepo.save(exam);
      return this.toDto(updated);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverErr = error.driverError as { code?: string };
        if (driverErr.code === '23505') {
          throw new ConflictException(
            '참가자 등록 중 DB 제약 조건 오류가 발생했습니다.',
          );
        }
      }
      throw new InternalServerErrorException(
        '참가자 등록 중 오류가 발생했습니다.',
      );
    }
  }

  /** 참가자 목록 조회 */
  async getParticipants(id: number): Promise<UserResponseDto[]> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!exam) {
      throw new NotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }
    return exam.participants.map((u) => ({ id: u.id, nickname: u.nickname }));
  }

  /** 자동 상태 전환 (스케줄러용) */
  async processScheduled(): Promise<void> {
    const now = new Date();

    const toStart = await this.examRepo
      .createQueryBuilder('exam')
      .where('exam.status = :status', { status: ExamStatus.CREATED })
      .andWhere('exam.startedAt <= :now', { now })
      .getMany();

    for (const exam of toStart) {
      exam.status = ExamStatus.STARTED;
      this.logger.log(`자동 시작: Exam ID=${exam.id}`);
      await this.examRepo.save(exam);
    }

    const toComplete = await this.examRepo
      .createQueryBuilder('exam')
      .where('exam.status = :status', { status: ExamStatus.STARTED })
      .andWhere('exam.endedAt <= :now', { now })
      .getMany();

    for (const exam of toComplete) {
      exam.status = ExamStatus.COMPLETED;
      this.logger.log(`자동 완료: Exam ID=${exam.id}`);
      await this.examRepo.save(exam);
    }
  }
}
