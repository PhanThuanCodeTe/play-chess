import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete,
  UseGuards
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RoomType } from './entities/room.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('rooms')
@UseGuards(JwtAuthGuard) // Yêu cầu xác thực JWT cho tất cả các endpoint
@ApiTags('Rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  /**
   * Tạo phòng riêng để chờ bạn bè join
   * 
   * @param user - Người dùng hiện tại (tự động inject từ JWT)
   * @param body.time_control - Thời gian cho mỗi bên (phút), mặc định 10 phút
   * @param body.room_type - Loại phòng (PUBLIC/PRIVATE), mặc định PUBLIC
   * @returns Thông tin phòng được tạo
   */
  @Post('create-private')
  @ApiOperation({ summary: 'Tạo phòng riêng để chờ bạn bè join' })
  async createPrivateRoom(
    @CurrentUser() user: User,
    @Body() body: { 
      time_control?: number;
      room_type?: RoomType;
    }
  ) {
    return this.roomsService.createPrivateRoom(
      user.id,
      body.time_control || 10,
      body.room_type || RoomType.PUBLIC
    );
  }

  /**
   * Tìm đối thủ tự động thông qua hệ thống matchmaking
   * 
   * @param user - Người dùng hiện tại
   * @param body.time_control - Thời gian cho mỗi bên (phút)
   * @param body.room_type - Loại phòng
   * @param body.max_wait_time - Thời gian tối đa chờ đối thủ (giây)
   * @param body.allow_random_opponent - Cho phép ghép với người lạ
   * @returns Thông tin phòng matchmaking
   */
  @Post('find-match')
  @ApiOperation({ summary: 'Tìm đối thủ tự động (matchmaking)' })
  async startMatchmaking(
    @CurrentUser() user: User,
    @Body() body: { 
      time_control?: number;
      room_type?: RoomType;
      max_wait_time?: number;
      allow_random_opponent?: boolean;
    }
  ) {
    return this.roomsService.startMatchmaking(
      user.id,
      body.time_control || 10,
      body.room_type || RoomType.PUBLIC,
      {
        maxWaitTime: body.max_wait_time || 60,
        allowRandomOpponent: body.allow_random_opponent !== false
      }
    );
  }

  /**
   * Hủy việc tìm trận đấu
   * 
   * @param user - Người dùng hiện tại
   * @returns Kết quả hủy matchmaking
   */
  @Post('cancel-matchmaking')
  @ApiOperation({ summary: 'Hủy tìm trận' })
  async cancelMatchmaking(@CurrentUser() user: User) {
    return this.roomsService.cancelMatchmaking(user.id);
  }

  /**
   * Join vào phòng riêng bằng mã phòng
   * 
   * @param user - Người dùng hiện tại
   * @param roomCode - Mã phòng để join
   * @returns Thông tin phòng sau khi join
   */
  @Post('join/:roomCode')
  @ApiOperation({ summary: 'Join phòng bằng room code' })
  async joinPrivateRoom(
    @CurrentUser() user: User,
    @Param('roomCode') roomCode: string
  ) {
    return this.roomsService.joinPrivateRoom(user.id, roomCode);
  }

  /**
   * Lấy trạng thái hiện tại của hệ thống matchmaking
   * Dùng cho mục đích debug và monitoring
   * 
   * @returns Thông tin về queue matchmaking
   */
  @Get('matchmaking-status')
  @ApiOperation({ summary: 'Xem trạng thái queue tìm trận' })
  async getMatchmakingStatus() {
    return this.roomsService.getMatchmakingStatus();
  }

  /**
   * Rời khỏi phòng hiện tại
   * 
   * @param user - Người dùng hiện tại
   * @param roomId - ID của phòng cần rời
   * @returns Kết quả rời phòng
   */
  @Post(':roomId/leave')
  @ApiOperation({ summary: 'Rời phòng' })
  async leaveRoom(
    @CurrentUser() user: User,
    @Param('roomId') roomId: string
  ) {
    return this.roomsService.leaveRoom(user.id, roomId);
  }

  /**
   * Lấy thông tin chi tiết của một phòng
   * 
   * @param roomId - ID của phòng cần xem thông tin
   * @returns Thông tin chi tiết của phòng
   */
  @Get(':roomId')
  @ApiOperation({ summary: 'Lấy thông tin phòng' })
  async getRoomInfo(@Param('roomId') roomId: string) {
    return this.roomsService.getRoomInfo(roomId);
  }

  // =============================================================================
  // LEGACY APIs (Deprecated - sẽ xóa trong tương lai)
  // =============================================================================

  /**
   * API cũ để tìm trận nhanh
   * @deprecated Sử dụng /rooms/find-match thay thế
   * 
   * @param user - Người dùng hiện tại
   * @param body.time_control - Thời gian cho mỗi bên
   * @param body.room_type - Loại phòng
   * @returns Chuyển hướng đến hệ thống matchmaking mới
   */
  @Post('quick-match')
  async quickMatch(
    @CurrentUser() user: User,
    @Body() body: { 
      time_control?: number;
      room_type?: RoomType;
    }
  ) {
    return this.roomsService.startMatchmaking(
      user.id,
      body.time_control || 10,
      body.room_type || RoomType.PUBLIC
    );
  }

  /**
   * API cũ để tạo phòng
   * @deprecated Sử dụng /rooms/create-private thay thế
   * 
   * @param user - Người dùng hiện tại
   * @param body.time_control - Thời gian cho mỗi bên
   * @param body.room_type - Loại phòng
   * @returns Chuyển hướng đến hệ thống phòng riêng mới
   */
  @Post('create')
  async createRoom(
    @CurrentUser() user: User,
    @Body() body: { 
      time_control?: number;
      room_type?: RoomType;
    }
  ) {
    return this.roomsService.createPrivateRoom(
      user.id,
      body.time_control || 10,
      body.room_type || RoomType.PUBLIC
    );
  }
}