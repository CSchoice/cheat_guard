import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ExamStatus {
  CREATED = 'created',
  STARTED = 'started',
  COMPLETED = 'completed',
}

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'enum', enum: ExamStatus, default: ExamStatus.CREATED })
  status: ExamStatus;

  @Column({ type: 'timestamp', nullable: false })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: false })
  endedAt: Date;

  @Column({ type: 'int', nullable: false })
  creatorId: number;

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: 'exam_participants',
    joinColumn: { name: 'exam_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: User[];
}
