import { IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { RoomType } from '../entities/room.entity';

export class QuickMatchDto {
  @IsOptional()
  @IsEnum(RoomType)
  room_type?: RoomType = RoomType.PUBLIC;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  time_control?: number = 10;
}