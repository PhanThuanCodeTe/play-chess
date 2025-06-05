import { IsString, Length, IsOptional } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @Length(6, 6)
  room_code: string;
}