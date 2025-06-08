import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RoomStatus {
  WAITING = 'waiting',      // Phòng trống, chưa có ai
  QUEUED = 'queued',        // Có 1 người, đang chờ người thứ 2
  IN_PROGRESS = 'in_progress', // Đang chơi
  FINISHED = 'finished'     // Đã kết thúc
}

export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

export enum RoomCreationMode {
  PRIVATE_ROOM = 'private_room',     // Phòng riêng, chờ bạn bè join
  MATCHMAKING = 'matchmaking'        // Tìm trận tự động
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 5 })
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
    default: RoomStatus.WAITING
  })
  status: RoomStatus;

  @Column({
    type: 'enum',
    enum: RoomCreationMode,
    default: RoomCreationMode.PRIVATE_ROOM,
    nullable: true
  })
  creation_mode?: RoomCreationMode;

  @Column({ default: 10 })
  time_control: number;

  @Column({ default: 3 })
  max_spectators: number;

  @Column({ default: 0 })
  current_spectators: number;

  // Player relationships
  @Column({ nullable: true })
  player1_id: string | null;

  @Column({ nullable: true })
  player2_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'player1_id' })
  player1: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'player2_id' })
  player2: User | null;

  // Timestamps
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({   type: 'timestamptz',  nullable: true })
  game_started_at: Date | null;

  @Column({   type: 'timestamptz',  nullable: true })
  game_finished_at: Date | null;

  // Metadata for matchmaking
  @Column({   type: 'text',   nullable: true })
  matchmaking_metadata: string | null; // JSON string chứa thông tin matchmaking

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

  isPrivateRoom(): boolean {
    return this.creation_mode === RoomCreationMode.PRIVATE_ROOM;
  }

  isMatchmakingRoom(): boolean {
    return this.creation_mode === RoomCreationMode.MATCHMAKING;
  }
}