// src/modules/exams/entities/exam-participant.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Exam } from './exam.entity';

@Entity('exam_participants')
export class ExamParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Exam, (exam) => exam.examParticipants, {
    onDelete: 'CASCADE',
  })
  exam: Exam;

  @ManyToOne(() => User, (user) => user.examParticipants, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ default: false })
  isCompleted: boolean;
}
