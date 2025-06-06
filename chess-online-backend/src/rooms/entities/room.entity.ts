import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

export enum RoomStatus {
  WAITING = 'waiting',    // Phòng trống, chưa có ai
  QUEUED = 'queued',      // Có 1 người chơi, đang chờ người thứ 2
  IN_PROGRESS = 'in_progress', // Đang chơi (2 người)
  FINISHED = 'finished'   // Kết thúc, có thể tái sử dụng
}

@Entity('rooms')
@Index(['status', 'room_type', 'time_control']) // Composite index cho tìm kiếm nhanh
@Index(['room_code'], { unique: true })
@Index(['status']) // Single index cho status
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'varchar', 
    length: 5, 
    unique: true,
    comment: '5-digit room code for display'
  })
  room_code: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.PUBLIC
  })
  room_type: RoomType;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING,
    comment: 'Room status for quick filtering'
  })
  status: RoomStatus;

  @Column({
    type: 'int',
    default: 10,
    comment: 'Time control in minutes per player'
  })
  time_control: number;

  @Column({
    type: 'int',
    default: 3,
    comment: 'Maximum number of spectators allowed'
  })
  max_spectators: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Current number of spectators'
  })
  current_spectators: number;

  @Column({ 
    type: 'uuid', 
    nullable: true,
    comment: 'First player ID'
  })
  player1_id: string | null;

  @Column({ 
    type: 'uuid', 
    nullable: true,
    comment: 'Second player ID' 
  })
  player2_id: string | null;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'player1_id' })
  player1: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'player2_id' })
  player2: User | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When the game actually started'
  })
  game_started_at: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When the game finished'
  })
  game_finished_at: Date | null;

  // Helper methods
  isEmpty(): boolean {
    return !this.player1_id && !this.player2_id;
  }

  hasOnePlayer(): boolean {
    return (!!this.player1_id && !this.player2_id) || (!this.player1_id && !!this.player2_id);
  }

  isFull(): boolean {
    return !!this.player1_id && !!this.player2_id;
  }

  getAvailablePlayerSlot(): 'player1' | 'player2' | null {
    if (!this.player1_id) return 'player1';
    if (!this.player2_id) return 'player2';
    return null;
  }
}