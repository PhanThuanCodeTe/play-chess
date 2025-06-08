import { 
  Controller, 
  Post, 
  Put, 
  Patch, 
  Body, 
  UseInterceptors, 
  UploadedFiles, 
  Param, 
  BadRequestException,
  Get
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserCoinDto, UpdateUserRankDto } from './dto/update-user.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public() // Đăng ký không cần authentication
  @Post('register')
  @ApiOperation({ summary: 'Tạo người dùng' })
  @ApiResponse({ status: 201, description: 'Người dùng đã được tạo.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getUserProfile(user.id);
  }

  @Put('profile')
  @UseInterceptors(
    FilesInterceptor('images', 3, {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return callback(new BadRequestException('Chỉ cho phép file hình ảnh!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
        files: 3,
      },
    }),
  )
  async updateProfile(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUserProfile(user.id, updateUserDto, files);
  }

  @Patch('coin')
  updateCoin(
    @CurrentUser() user: User,
    @Body() updateCoinDto: UpdateUserCoinDto,
  ) {
    return this.usersService.updateUserCoin(user.id, updateCoinDto.coin);
  }

  @Patch('rank')
  updateRank(
    @CurrentUser() user: User,
    @Body() updateRankDto: UpdateUserRankDto,
  ) {
    return this.usersService.updateUserRank(user.id, updateRankDto.rank_point);
  }
}