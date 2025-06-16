import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
}
