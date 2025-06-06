import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RoomType } from './entities/room.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  /**
   * Tìm và join phòng tự động (matchmaking)
   * POST /rooms/quick-match
   */
  @Post('quick-match')
  async quickMatch(
    @CurrentUser() user: User,
    @Body() body: { 
      time_control?: number, 
      room_type?: RoomType 
    }
  ) {
    return this.roomsService.findAndJoinRoom(
      user.id,
      body.time_control || 10,
      body.room_type || RoomType.PUBLIC
    );
  }

  /**
   * Tạo phòng mới
   * POST /rooms/create
   */
  @Post('create')
  async createRoom(
    @CurrentUser() user: User,
    @Body() body: { 
      time_control?: number, 
      room_type?: RoomType 
    }
  ) {
    return this.roomsService.createNewRoom(
      user.id,
      body.time_control || 10,
      body.room_type || RoomType.PUBLIC
    );
  }

  /**
   * Join phòng theo room code
   * POST /rooms/join/:roomCode
   */
  @Post('join/:roomCode')
  async joinRoomByCode(
    @CurrentUser() user: User,
    @Param('roomCode') roomCode: string
  ) {
    return this.roomsService.joinRoomByCode(user.id, roomCode);
  }

  /**
   * Rời phòng
   * POST /rooms/:roomId/leave
   */
  @Post(':roomId/leave')
  async leaveRoom(
    @CurrentUser() user: User,
    @Param('roomId') roomId: string
  ) {
    return this.roomsService.leaveRoom(user.id, roomId);
  }

  /**
   * Lấy thông tin phòng
   * GET /rooms/:roomId
   */
  @Get(':roomId')
  async getRoomInfo(@Param('roomId') roomId: string) {
    return this.roomsService.getRoomInfo(roomId);
  }

  /**
   * Lấy danh sách phòng (cho admin hoặc debugging)
   * GET /rooms
   */
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return this.roomsService.findAll();
  }

  @Post('create-all-possible-rooms')
  @ApiOperation({ summary: 'Tạo tất cả các phòng có thể có (00000-99999)' })
  @ApiResponse({ status: 200, description: 'Tạo thành công tất cả các phòng' })
  createAllPossibleRooms() {
    return this.roomsService.createAllPossibleRooms();
  }

  // Legacy endpoints (deprecated)
  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    // Deprecated - use /rooms/create instead
    return this.roomsService.create(createRoomDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(+id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }
}