import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
  ) {}

  /** Entity → DTO 변환 */
  private toDto(exam: Exam, userId: number): ExamResponseDto {
    const dto = new ExamResponseDto();
    dto.id = exam.id;
    dto.title = exam.title;
    dto.status = exam.status;
    dto.startedAt = exam.startedAt;
    dto.endedAt = exam.endedAt;
    dto.isParticipating = exam.participants.some((u) => u.id === userId);
    return dto;
  }

  /** 시험 생성 */
  async create(
    dto: CreateExamRequestDto,
    userId: number,
  ): Promise<ExamResponseDto> {
    const exam = this.examRepo.create({
      title: dto.title,
      startedAt: new Date(dto.startAt),
      endedAt: new Date(dto.endAt),
      creatorId: userId,
    });

    exam.participants = []; // 초기 참가자는 빈 배열로 설정
    if (exam.startedAt < new Date()) {
      throw new ConflictException('시작 시간은 현재 시간 이후여야 합니다.');
    }
    if (exam.endedAt <= exam.startedAt) {
      throw new ConflictException('종료 시간은 시작 시간 이후여야 합니다.');
    }
    if (exam.title.length < 2 || exam.title.length > 50) {
      throw new ConflictException(
        '시험 제목은 2자 이상 50자 이하이어야 합니다.',
      );
    }
    if (!/^[a-zA-Z0-9ㄱ-ㅎ가-힣\s]+$/.test(exam.title)) {
      throw new ConflictException(
        '시험 제목은 한글, 영어, 숫자, 공백만 포함할 수 있습니다.',
      );
    }
    if (exam.title.includes('  ')) {
      throw new ConflictException(
        '시험 제목에 연속된 공백이 포함될 수 없습니다.',
      );
    }
    if (exam.title.trim() === '') {
      throw new ConflictException('시험 제목은 공백만 포함할 수 없습니다.');
    }
    if (exam.title.startsWith(' ') || exam.title.endsWith(' ')) {
      throw new ConflictException(
        '시험 제목은 양쪽 끝에 공백을 포함할 수 없습니다.',
      );
    }
    if (exam.title.includes('\n')) {
      throw new ConflictException(
        '시험 제목에 줄바꿈 문자가 포함될 수 없습니다.',
      );
    }
    if (exam.title.includes('\r')) {
      throw new ConflictException(
        '시험 제목에 캐리지 리턴 문자가 포함될 수 없습니다.',
      );
    }

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

  /** 모든 시험 조회 */
  async findAll(userId: number): Promise<ExamResponseDto[]> {
    const exams = await this.examRepo.find({ relations: ['participants'] });
    return exams.map((e) => this.toDto(e, userId));
  }

  /** 단일 시험 조회 */
  async findOne(id: number, userId: number): Promise<ExamResponseDto> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!exam) {
      throw new NotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }
    return this.toDto(exam, userId);
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
      return this.toDto(updated, dto.userId);
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

  /** 참가 등록 취소 */
  async unregisterUser(id: number, userId: number): Promise<ExamResponseDto> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!exam) {
      throw new NotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }

    exam.participants = exam.participants.filter((u) => u.id !== userId);

    try {
      const updated = await this.examRepo.save(exam);
      return this.toDto(updated, userId);
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

  async startExam(
    examId: number,
    userId: number,
  ): Promise<{ sessionId: string; fastApiUrl: string }> {
    // 1) 시험 조회
    const exam = await this.examRepo.findOne({
      where: { id: examId },
      relations: ['participants'],
    });
    if (!exam) throw new NotFoundException('시험을 찾을 수 없습니다.');

    // 2) 참가 여부 확인
    if (!exam.participants.some((p) => p.id === userId)) {
      throw new ConflictException('시험에 참가하지 않은 사용자입니다.');
    }

    // 3) 이미 시작 혹은 완료된 시험인지 체크
    if (exam.status !== ExamStatus.CREATED) {
      throw new ConflictException('이미 시작되었거나 종료된 시험입니다.');
    }

    // 4) 상태 변경
    exam.status = ExamStatus.STARTED;
    // exam.startedAt = new Date();    // 스케줄된 시간이 아니라 '실제' 시작 시간으로 덮어쓰려면 활성화

    // await this.examRepo.save(exam);

    // 5) sessionId, fastApiUrl 생성 (필요하다면)
    const timestamp = Date.now();
    const sessionId = `session_${examId}_${userId}_${timestamp}`;
    const fastApiUrl =
      this.configService.get<string>('fastApiUrl') || 'http://localhost:8000';

    return { sessionId, fastApiUrl };
  }

  /** 내가 참여중인 시험 조회 */
  async findMyExams(userId: number): Promise<ExamResponseDto[]> {
    // participants 에 userId 가 포함된 exam 조회
    const exams = await this.examRepo
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.participants', 'user')
      .where('user.id = :userId', { userId })
      .getMany();

    return exams.map((e) => this.toDto(e, userId));
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
