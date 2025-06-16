import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
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
    const exam = this.examRepo.create(dto);
    try {
      const saved = await this.examRepo.save(exam);
      return this.toDto(saved);
    } catch (err) {
      if (err instanceof QueryFailedError && (err as any).code === '23505') {
        throw new ConflictException('이미 같은 제목의 시험이 존재합니다.');
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

  /** 시험 시작 */
  async start(id: number): Promise<ExamResponseDto> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!exam) {
      throw new NotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }
    exam.status = ExamStatus.STARTED;
    exam.startedAt = new Date();

    try {
      const updated = await this.examRepo.save(exam);
      return this.toDto(updated);
    } catch {
      throw new InternalServerErrorException(
        '시험 시작 처리 중 오류가 발생했습니다.',
      );
    }
  }

  /** 시험 완료 */
  async complete(id: number): Promise<ExamResponseDto> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!exam) {
      throw new NotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }
    exam.status = ExamStatus.COMPLETED;
    exam.endedAt = new Date();

    try {
      const updated = await this.examRepo.save(exam);
      return this.toDto(updated);
    } catch {
      throw new InternalServerErrorException(
        '시험 완료 처리 중 오류가 발생했습니다.',
      );
    }
  }

  /** 참가자 등록 */
  async registerUser(
    id: number,
    dto: RegisterExamUserDto,
  ): Promise<ExamResponseDto> {
    // 1) 시험 조회
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!exam) {
      throw new NotFoundException(`ID ${id} 번 시험을 찾을 수 없습니다.`);
    }

    // 2) 중복 등록 방지
    if (exam.participants.some((u) => u.id === dto.userId)) {
      throw new ConflictException(
        `사용자(ID ${dto.userId})가 이미 등록되어 있습니다.`,
      );
    }

    // 3) 사용자 엔티티 조회 (서비스 내부 메서드 사용)
    let userEntity: User;
    try {
      // findOneById 는 UsersService에 private에서 공개된 형태로 구현해 두셔야 합니다.
      userEntity = await this.usersService['findOneById'](dto.userId);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(
        '사용자 조회 중 오류가 발생했습니다.',
      );
    }

    // 4) 참가자 추가 및 저장
    exam.participants.push(userEntity);
    try {
      const updated = await this.examRepo.save(exam);
      return this.toDto(updated);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw new ConflictException(
          '참가자 등록 중 DB 제약 조건 오류가 발생했습니다.',
        );
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
}
