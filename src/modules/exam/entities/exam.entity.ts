// src/modules/exams/entities/exam.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ExamParticipant } from './exam-participant.entity';

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

  @Column({ type: 'timestamp', nullable: false })
  deadlineAt: Date;

  @Column({ type: 'int', nullable: false })
  creatorId: number;

  @OneToMany(() => ExamParticipant, (ep) => ep.exam)
  examParticipants: ExamParticipant[];
}
