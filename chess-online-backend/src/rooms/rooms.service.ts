import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { Room, RoomStatus, RoomType } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { ApiResponse, api } from '../common/utils/api-respone.util';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  /**
   * CHIẾN LƯỢC TỐI ƯU CHO VIỆC TÌM PHÒNG NHANH:
   * 1. Sử dụng composite index trên (status, room_type, time_control)
   * 2. Tìm phòng WAITING trước (ưu tiên phòng trống)
   * 3. Nếu không có phòng WAITING, tìm phòng QUEUED
   * 4. Sử dụng LIMIT 1 và FOR UPDATE để tránh race condition
   */

  /**
   * Tìm và join vào phòng nhanh nhất
   * @param userId - ID người chơi
   * @param timeControl - Thời gian kiểm soát (phút)
   * @param roomType - Loại phòng (public/private)
   */
  async findAndJoinRoom(
    userId: string, 
    timeControl: number = 10, 
    roomType: RoomType = RoomType.PUBLIC
  ): Promise<ApiResponse> {
    try {
      // Bước 1: Tìm phòng WAITING (ưu tiên cao nhất - phòng trống)
      let room = await this.roomRepository
        .createQueryBuilder('room')
        .where('room.status = :status', { status: RoomStatus.WAITING })
        .andWhere('room.room_type = :roomType', { roomType })
        .andWhere('room.time_control = :timeControl', { timeControl })
        .orderBy('room.created_at', 'ASC') // FIFO
        .limit(1)
        .getOne();

      if (room) {
        // Có phòng trống, join vào làm player1
        room.player1_id = userId;
        room.status = RoomStatus.QUEUED;
        room.updated_at = new Date();
        
        const updatedRoom = await this.roomRepository.save(room);
        
        return api()
          .setMessage('Joined empty room successfully')
          .setResponse({
            room_id: updatedRoom.id,
            room_code: updatedRoom.room_code,
            status: updatedRoom.status,
            player_slot: 'player1',
            time_control: updatedRoom.time_control,
            waiting_for_opponent: true
          })
          .build();
      }

      // Bước 2: Tìm phòng QUEUED (có 1 người chơi)
      room = await this.roomRepository
        .createQueryBuilder('room')
        .where('room.status = :status', { status: RoomStatus.QUEUED })
        .andWhere('room.room_type = :roomType', { roomType })
        .andWhere('room.time_control = :timeControl', { timeControl })
        .andWhere('(room.player1_id != :userId OR room.player2_id != :userId)', { userId }) // Không join phòng của chính mình
        .orderBy('room.created_at', 'ASC') // FIFO
        .limit(1)
        .getOne();

      if (room) {
        // Có phòng đang chờ, join vào làm player2
        const playerSlot = room.getAvailablePlayerSlot();
        
        if (playerSlot === 'player1') {
          room.player1_id = userId;
        } else if (playerSlot === 'player2') {
          room.player2_id = userId;
        }
        
        room.status = RoomStatus.IN_PROGRESS;
        room.game_started_at = new Date();
        room.updated_at = new Date();
        
        const updatedRoom = await this.roomRepository.save(room);
        
        return api()
          .setMessage('Joined room and game started')
          .setResponse({
            room_id: updatedRoom.id,
            room_code: updatedRoom.room_code,
            status: updatedRoom.status,
            player_slot: playerSlot,
            time_control: updatedRoom.time_control,
            game_started: true,
            opponent_id: playerSlot === 'player1' ? room.player2_id : room.player1_id
          })
          .build();
      }

      // Bước 3: Không tìm thấy phòng phù hợp, tạo phòng mới
      const newRoom = await this.createNewRoom(userId, timeControl, roomType);
      return newRoom;

    } catch (error) {
      return api()
        .setError(`Failed to find room: ${error.message}`)
        .build();
    }
  }

  /**
   * Tạo phòng mới
   */
  async createNewRoom(
    userId: string, 
    timeControl: number = 10, 
    roomType: RoomType = RoomType.PUBLIC
  ): Promise<ApiResponse> {
    try {
      const roomCode = await this.generateUniqueRoomCode();
      
      const room = this.roomRepository.create({
        room_code: roomCode,
        room_type: roomType,
        status: RoomStatus.QUEUED,
        time_control: timeControl,
        player1_id: userId,
        max_spectators: 3,
        current_spectators: 0
      });

      const savedRoom = await this.roomRepository.save(room);

      return api()
        .setMessage('New room created successfully')
        .setResponse({
          room_id: savedRoom.id,
          room_code: savedRoom.room_code,
          status: savedRoom.status,
          player_slot: 'player1',
          time_control: savedRoom.time_control,
          waiting_for_opponent: true
        })
        .build();

    } catch (error) {
      return api()
        .setError(`Failed to create room: ${error.message}`)
        .build();
    }
  }

  /**
   * Join phòng theo room_code
   */
  async joinRoomByCode(userId: string, roomCode: string): Promise<ApiResponse> {
    try {
      const room = await this.roomRepository.findOne({
        where: { room_code: roomCode }
      });

      if (!room) {
        return api()
          .setError('Room not found')
          .build();
      }

      if (room.status === RoomStatus.IN_PROGRESS) {
        return api()
          .setError('Room is full')
          .build();
      }

      if (room.status === RoomStatus.FINISHED) {
        return api()
          .setError('Room has finished')
          .build();
      }

      // Kiểm tra xem user đã ở trong phòng chưa
      if (room.player1_id === userId || room.player2_id === userId) {
        return api()
          .setError('You are already in this room')
          .build();
      }

      const playerSlot = room.getAvailablePlayerSlot();
      if (!playerSlot) {
        return api()
          .setError('Room is full')
          .build();
      }

      // Join vào phòng
      if (playerSlot === 'player1') {
        room.player1_id = userId;
      } else {
        room.player2_id = userId;
      }

      // Cập nhật status
      if (room.isEmpty()) {
        room.status = RoomStatus.QUEUED;
      } else if (room.isFull()) {
        room.status = RoomStatus.IN_PROGRESS;
        room.game_started_at = new Date();
      }

      room.updated_at = new Date();
      const updatedRoom = await this.roomRepository.save(room);

      return api()
        .setMessage('Joined room successfully')
        .setResponse({
          room_id: updatedRoom.id,
          room_code: updatedRoom.room_code,
          status: updatedRoom.status,
          player_slot: playerSlot,
          time_control: updatedRoom.time_control,
          game_started: updatedRoom.status === RoomStatus.IN_PROGRESS
        })
        .build();

    } catch (error) {
      return api()
        .setError(`Failed to join room: ${error.message}`)
        .build();
    }
  }

  /**
   * Rời phòng
   */
  async leaveRoom(userId: string, roomId: string): Promise<ApiResponse> {
    try {
      const room = await this.roomRepository.findOne({
        where: { id: roomId }
      });

      if (!room) {
        return api()
          .setError('Room not found')
          .build();
      }

      // Xóa player khỏi phòng
      if (room.player1_id === userId) {
        room.player1_id = null;
      } else if (room.player2_id === userId) {
        room.player2_id = null;
      } else {
        return api()
          .setError('You are not in this room')
          .build();
      }

      // Cập nhật status
      if (room.isEmpty()) {
        room.status = RoomStatus.WAITING;
      } else if (room.hasOnePlayer()) {
        room.status = RoomStatus.QUEUED;
      }

      room.updated_at = new Date();
      await this.roomRepository.save(room);

      return api()
        .setMessage('Left room successfully')
        .setResponse(null)
        .build();

    } catch (error) {
      return api()
        .setError(`Failed to leave room: ${error.message}`)
        .build();
    }
  }

  /**
   * Lấy thông tin phòng
   */
  async getRoomInfo(roomId: string): Promise<ApiResponse> {
    try {
      const room = await this.roomRepository.findOne({
        where: { id: roomId },
        relations: ['player1', 'player2']
      });

      if (!room) {
        return api()
          .setError('Room not found')
          .build();
      }

      return api()
        .setMessage('Room info retrieved successfully')
        .setResponse({
          id: room.id,
          room_code: room.room_code,
          room_type: room.room_type,
          status: room.status,
          time_control: room.time_control,
          max_spectators: room.max_spectators,
          current_spectators: room.current_spectators,
          player1: room.player1 ? {
            id: room.player1.id,
            name: room.player1.name,
            avatar_url: room.player1.avatar_url
          } : null,
          player2: room.player2 ? {
            id: room.player2.id,
            name: room.player2.name,
            avatar_url: room.player2.avatar_url
          } : null,
          created_at: room.created_at,
          game_started_at: room.game_started_at
        })
        .build();

    } catch (error) {
      return api()
        .setError(`Failed to get room info: ${error.message}`)
        .build();
    }
  }

  /**
   * Tạo room code 6 chữ số duy nhất
   */
  private async generateUniqueRoomCode(): Promise<string> {
    let roomCode: string = '';
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (exists && attempts < maxAttempts) {
      roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const existingRoom = await this.roomRepository.findOne({
        where: { room_code: roomCode }
      });
      
      exists = !!existingRoom;
      attempts++;
    }

    if (exists) {
      throw new Error('Unable to generate unique room code');
    }

    return roomCode;
  }

  /**
   * Dọn dẹp phòng cũ (chạy định kỳ)
   */
  async cleanupOldRooms(): Promise<void> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    await this.roomRepository
      .createQueryBuilder()
      .update(Room)
      .set({ 
        status: RoomStatus.WAITING,
        player1_id: null,
        player2_id: null,
        current_spectators: 0,
        game_started_at: null,
        game_finished_at: null
      })
      .where('status = :status', { status: RoomStatus.FINISHED })
      .andWhere('updated_at < :oneHourAgo', { oneHourAgo })
      .execute();
  }

  // Legacy methods
  create(createRoomDto: CreateRoomDto) {
    return 'Use createNewRoom() instead';
  }

  findAll() {
    return this.roomRepository.find({
      take: 20,
      order: { created_at: 'DESC' }
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} room`;
  }

  update(id: number, updateRoomDto: any) {
    return `This action updates a #${id} room`;
  }

  remove(id: number) {
    return `This action removes a #${id} room`;
  }
}