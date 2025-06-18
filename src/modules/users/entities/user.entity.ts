import { ExamParticipant } from 'src/modules/exam/entities/exam-participant.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  password: string;

  @Column({ unique: true })
  nickname: string;

  @Column({ default: 'student' })
  role: 'student' | 'admin';

  @OneToMany(() => ExamParticipant, (ep) => ep.user)
  examParticipants: ExamParticipant[];
}
