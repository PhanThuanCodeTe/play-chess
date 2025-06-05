import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RoomStatus } from '../entities/room.entity';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @IsUUID()
  player1_id?: string | null;

  @IsOptional()
  @IsUUID()
  player2_id?: string | null;
}