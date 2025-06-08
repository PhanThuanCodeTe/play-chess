/**
 * Service quản lý phòng chơi cờ vua
 * Bao gồm các chức năng:
 * - Tạo phòng riêng để chờ bạn bè
 * - Tìm trận đấu tự động (matchmaking)
 * - Quản lý người chơi trong phòng
 * - Xử lý các trạng thái phòng
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus, RoomType } from './entities/room.entity';
import { ApiResponse, api } from '../common/utils/api-respone.util';

/**
 * Enum định nghĩa các chế độ tạo phòng
 * - PRIVATE_ROOM: Phòng riêng để chờ bạn bè join
 * - MATCHMAKING: Phòng tìm trận đấu tự động
 */
export enum RoomCreationMode {
  PRIVATE_ROOM = 'private_room',
  MATCHMAKING = 'matchmaking'
}

/**
 * Interface định nghĩa thông tin người chơi trong hàng đợi matchmaking
 */
interface MatchmakingPlayer {
  userId: string;                    // ID người chơi
  timeControl: number;              // Thời gian cho mỗi bên (phút)
  roomType: RoomType;               // Loại phòng (PUBLIC/PRIVATE)
  timestamp: Date;                  // Thời điểm vào hàng đợi
  preferences?: {                   // Tùy chọn thêm
    allowRandomOpponent?: boolean;  // Cho phép đấu với người lạ
    maxWaitTime?: number;          // Thời gian chờ tối đa (phút)
  };
}

@Injectable()
export class RoomsService {
  // Map lưu trữ hàng đợi matchmaking
  private matchmakingQueue: Map<string, MatchmakingPlayer> = new Map();

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  /**
   * Tạo phòng riêng để chờ bạn bè join
   * @param userId ID người tạo phòng
   * @param timeControl Thời gian cho mỗi bên (phút)
   * @param roomType Loại phòng (PUBLIC/PRIVATE)
   * @returns ApiResponse chứa thông tin phòng đã tạo
   */
  async createPrivateRoom(
    userId: string,
    timeControl: number = 10,
    roomType: RoomType = RoomType.PUBLIC
  ): Promise<ApiResponse> {
    try {
      // Tìm phòng trống (WAITING và không có người chơi)
      const emptyRoom = await this.roomRepository
        .createQueryBuilder('room')
        .where('room.status = :status', { status: RoomStatus.WAITING })
        .andWhere('room.player1_id IS NULL')
        .andWhere('room.player2_id IS NULL')
        .limit(1)
        .getOne();

      if (!emptyRoom) {
        return api()
          .setError('No available rooms. Please try again later.')
          .build();
      }

      // Cập nhật thông tin phòng
      emptyRoom.player1_id = userId;
      emptyRoom.status = RoomStatus.QUEUED;
      emptyRoom.time_control = timeControl;
      emptyRoom.room_type = roomType;
      emptyRoom.updated_at = new Date();
      emptyRoom.creation_mode = RoomCreationMode.PRIVATE_ROOM;

      const savedRoom = await this.roomRepository.save(emptyRoom);

      return api()
        .setMessage('Private room created successfully')
        .setResponse({
          room_id: savedRoom.id,
          room_code: savedRoom.room_code,
          status: savedRoom.status,
          player_slot: 'player1',
          time_control: savedRoom.time_control,
          room_type: 'private',
          waiting_for_friend: true,
          share_code: savedRoom.room_code
        })
        .build();

    } catch (error) {
      return api()
        .setError(`Failed to create private room: ${error.message}`)
        .build();
    }
  }

  /**
   * Bắt đầu tìm trận đấu tự động
   * @param userId ID người chơi
   * @param timeControl Thời gian cho mỗi bên (phút)
   * @param roomType Loại phòng
   * @param options Tùy chọn thêm
   * @returns ApiResponse chứa trạng thái matchmaking
   */
  async startMatchmaking(
    userId: string,
    timeControl: number = 10,
    roomType: RoomType = RoomType.PUBLIC,
    options?: {
      allowRandomOpponent?: boolean;
      maxWaitTime?: number;
    }
  ): Promise<ApiResponse> {
    try {
      // Kiểm tra người chơi đã trong hàng đợi chưa
      if (this.matchmakingQueue.has(userId)) {
        return api()
          .setError('You are already in matchmaking queue')
          .build();
      }

      // Tìm đối thủ phù hợp trong hàng đợi
      const matchedPlayer = this.findMatchInQueue(timeControl, roomType, userId);

      if (matchedPlayer) {
        // Tạo trận đấu nếu tìm thấy đối thủ
        const gameRoom = await this.createMatchmakingGame(
          userId, 
          matchedPlayer.userId, 
          timeControl, 
          roomType
        );
        
        // Xóa cả 2 người chơi khỏi hàng đợi
        this.matchmakingQueue.delete(userId);
        this.matchmakingQueue.delete(matchedPlayer.userId);

        return gameRoom;
      }

      // Thêm vào hàng đợi nếu chưa tìm thấy đối thủ
      this.matchmakingQueue.set(userId, {
        userId,
        timeControl,
        roomType,
        timestamp: new Date(),
        preferences: options
      });

      // Bắt đầu đếm thời gian chờ
      this.startMatchmakingTimeout(userId, options?.maxWaitTime || 60);

      return api()
        .setMessage('Added to matchmaking queue')
        .setResponse({
          status: 'searching',
          estimated_wait_time: '30-60 seconds',
          queue_position: this.matchmakingQueue.size,
          can_cancel: true
        })
        .build();

    } catch (error) {
      return api()
        .setError(`Matchmaking failed: ${error.message}`)
        .build();
    }
  }

  /**
   * Hủy tìm trận đấu
   * @param userId ID người chơi
   * @returns ApiResponse thông báo kết quả
   */
  async cancelMatchmaking(userId: string): Promise<ApiResponse> {
    if (this.matchmakingQueue.has(userId)) {
      this.matchmakingQueue.delete(userId);
      return api()
        .setMessage('Matchmaking cancelled')
        .build();
    }

    return api()
      .setError('You are not in matchmaking queue')
      .build();
  }

  /**
   * Tham gia phòng riêng bằng mã phòng
   * @param userId ID người chơi
   * @param roomCode Mã phòng
   * @returns ApiResponse thông tin phòng sau khi tham gia
   */
  async joinPrivateRoom(userId: string, roomCode: string): Promise<ApiResponse> {
    try {
      const room = await this.roomRepository.findOne({
        where: { room_code: roomCode }
      });

      if (!room) {
        return api()
          .setError('No room matched your search')
          .build();
      }

      // Kiểm tra điều kiện tham gia
      if (room.status !== RoomStatus.QUEUED || room.creation_mode !== RoomCreationMode.PRIVATE_ROOM) {
        return api()
          .setError('Room is not available for joining')
          .build();
      }

      if (room.player1_id === userId) {
        return api()
          .setError('You are already in this room')
          .build();
      }

      if (room.player2_id) {
        return api()
          .setError('Room is full')
          .build();
      }

      // Cập nhật thông tin phòng
      room.player2_id = userId;
      room.status = RoomStatus.IN_PROGRESS;
      room.game_started_at = new Date();
      room.updated_at = new Date();

      const updatedRoom = await this.roomRepository.save(room);

      return api()
        .setMessage('Joined private room successfully')
        .setResponse({
          room_id: updatedRoom.id,
          room_code: updatedRoom.room_code,
          status: updatedRoom.status,
          player_slot: 'player2',
          game_started: true,
          opponent_id: room.player1_id
        })
        .build();

    } catch (error) {
      return api()
        .setError(`Failed to join room: ${error.message}`)
        .build();
    }
  }

  /**
   * Tìm đối thủ phù hợp trong hàng đợi
   * @param timeControl Thời gian cho mỗi bên
   * @param roomType Loại phòng
   * @param excludeUserId ID người chơi cần loại trừ
   * @returns MatchmakingPlayer hoặc null
   */
  private findMatchInQueue(
    timeControl: number, 
    roomType: RoomType, 
    excludeUserId: string
  ): MatchmakingPlayer | null {
    for (const [userId, player] of this.matchmakingQueue) {
      if (userId !== excludeUserId && 
          player.timeControl === timeControl && 
          player.roomType === roomType) {
        return player;
      }
    }
    return null;
  }

  /**
   * Tạo trận đấu cho 2 người chơi từ matchmaking
   * @param player1Id ID người chơi 1
   * @param player2Id ID người chơi 2
   * @param timeControl Thời gian cho mỗi bên
   * @param roomType Loại phòng
   * @returns ApiResponse thông tin trận đấu
   */
  private async createMatchmakingGame(
    player1Id: string,
    player2Id: string,
    timeControl: number,
    roomType: RoomType
  ): Promise<ApiResponse> {
    // Tìm phòng trống
    const emptyRoom = await this.roomRepository
      .createQueryBuilder('room')
      .where('room.status = :status', { status: RoomStatus.WAITING })
      .andWhere('room.player1_id IS NULL')
      .andWhere('room.player2_id IS NULL')
      .limit(1)
      .getOne();

    if (!emptyRoom) {
      throw new Error('No available rooms for matchmaking');
    }

    // Thiết lập thông tin trận đấu
    emptyRoom.player1_id = player1Id;
    emptyRoom.player2_id = player2Id;
    emptyRoom.status = RoomStatus.IN_PROGRESS;
    emptyRoom.time_control = timeControl;
    emptyRoom.room_type = roomType;
    emptyRoom.creation_mode = RoomCreationMode.MATCHMAKING;
    emptyRoom.game_started_at = new Date();
    emptyRoom.updated_at = new Date();

    const gameRoom = await this.roomRepository.save(emptyRoom);

    return api()
      .setMessage('Match found! Game started')
      .setResponse({
        room_id: gameRoom.id,
        room_code: gameRoom.room_code,
        status: gameRoom.status,
        time_control: gameRoom.time_control,
        game_started: true,
        match_type: 'ranked_match'
      })
      .build();
  }

  /**
   * Xử lý timeout khi tìm trận
   * @param userId ID người chơi
   * @param maxWaitTime Thời gian chờ tối đa (giây)
   */
  private startMatchmakingTimeout(userId: string, maxWaitTime: number) {
    setTimeout(async () => {
      const player = this.matchmakingQueue.get(userId);
      if (player) {
        // Xử lý khi hết thời gian chờ
        this.matchmakingQueue.delete(userId);
        
        // TODO: Thêm xử lý khi timeout
        // 1. Ghép với AI
        // 2. Mở rộng điều kiện tìm kiếm
        // 3. Thông báo và hủy
      }
    }, maxWaitTime * 1000);
  }

  /**
   * Lấy trạng thái hàng đợi matchmaking (cho mục đích debug)
   * @returns ApiResponse chứa thông tin hàng đợi
   */
  async getMatchmakingStatus(): Promise<ApiResponse> {
    const queueData = Array.from(this.matchmakingQueue.values()).map(player => ({
      userId: player.userId.substring(0, 8) + '...',
      timeControl: player.timeControl,
      roomType: player.roomType,
      waitTime: Math.floor((Date.now() - player.timestamp.getTime()) / 1000)
    }));

    return api()
      .setMessage('Matchmaking queue status')
      .setResponse({
        total_players: this.matchmakingQueue.size,
        queue: queueData
      })
      .build();
  }

  /**
   * Rời khỏi phòng
   * @param userId ID người chơi
   * @param roomId ID phòng
   * @returns ApiResponse thông báo kết quả
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

      // Xóa người chơi khỏi phòng
      if (room.player1_id === userId) {
        room.player1_id = null;
      } else if (room.player2_id === userId) {
        room.player2_id = null;
      } else {
        return api()
          .setError('You are not in this room')
          .build();
      }

      // Cập nhật trạng thái phòng
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
   * Lấy thông tin chi tiết của phòng
   * @param roomId ID phòng
   * @returns ApiResponse chứa thông tin phòng
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
   * Tạo mã phòng 5 chữ số duy nhất
   * @returns string Mã phòng
   */
  private async generateUniqueRoomCode(): Promise<string> {
    let roomCode: string = '00000';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const randomNum = Math.floor(Math.random() * 100000);
      roomCode = randomNum.toString().padStart(5, '0');

      const existingRoom = await this.roomRepository.findOne({
        where: { room_code: roomCode }
      });

      if (!existingRoom) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      throw new BadRequestException('Failed to generate unique room code after multiple attempts');
    }

    return roomCode;
  }

  /**
   * Dọn dẹp các phòng cũ (chạy định kỳ)
   * Reset các phòng đã kết thúc sau 1 giờ
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

  /**
   * Tạo tất cả các phòng có thể (00000-99999)
   * Chỉ dùng cho mục đích test và debug
   * @returns ApiResponse thông báo kết quả
   */
  async createAllPossibleRooms(): Promise<ApiResponse> {
    try {
      const rooms: Room[] = [];
      for (let i = 0; i < 100000; i++) {
        const roomCode = i.toString().padStart(5, '0');
        const room = this.roomRepository.create({
          room_code: roomCode,
          room_type: RoomType.PUBLIC,
          status: RoomStatus.WAITING,
          time_control: 10,
          max_spectators: 3,
          current_spectators: 0
        });
        rooms.push(room);
      }

      // Lưu theo batch để tối ưu hiệu suất
      const batchSize = 1000;
      for (let i = 0; i < rooms.length; i += batchSize) {
        const batch = rooms.slice(i, i + batchSize);
        await this.roomRepository.save(batch);
      }

      return api()
        .setMessage('Successfully created all possible rooms')
        .setResponse({
          total_rooms: rooms.length,
          first_room_code: '00000',
          last_room_code: '99999'
        })
        .build();

    } catch (error) {
      return api()
        .setError(`Failed to create rooms: ${error.message}`)
        .build();
    }
  }
}