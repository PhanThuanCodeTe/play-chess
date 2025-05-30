import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  slogan: string;

  @Column()
  avatar_url: string;

  @Column()
  avatar_frame: string;

  @Column({ nullable: true })
  background_image: string;

  @Column({ default: 0 })
  rank_point: number;

  @Column({ nullable: true })
  rank_name: string;

  @Column({ default: 0 })
  total_game: number;

  @Column({ default: 0 })
  win_match: number;

  @Column({ type: 'float', default: 0 })
  win_rate: number;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.OFFLINE,
  })
  status: UserStatus;

  @Column({ type: 'timestamptz', nullable: true })
  last_active: Date;

  @Column({ default: 0 })
  coin: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
