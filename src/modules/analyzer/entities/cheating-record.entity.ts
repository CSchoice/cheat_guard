import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'cheating_records' })
@Index(['examId', 'userId', 'sessionId', 'detectedAt'])
export class CheatingRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, comment: '시험 세션 ID' })
  sessionId: string;

  @Column({ type: 'int', comment: '시험 ID' })
  examId: number;

  @Column({ type: 'int', comment: '사용자 ID' })
  userId: number;

  @Column({ type: 'datetime', comment: '부정행위 발생 시간' })
  detectedAt: Date;

  @Column({ type: 'varchar', length: 255, comment: '부정행위 사유 메시지' })
  reason: string;

  @CreateDateColumn({ type: 'datetime', comment: '레코드 생성 시각' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '레코드 수정 시각' })
  updatedAt: Date;
}
