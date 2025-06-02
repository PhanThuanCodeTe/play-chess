import { Controller, Post, Put, Patch, Body, UseInterceptors, UploadedFiles, Param, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserCoinDto, UpdateUserRankDto } from './dto/update-user.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Put(':id/profile')
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
        files: 3, // Tối đa 3 file
      },
    }),
  )
  async updateProfile(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUserProfile(id, updateUserDto, files);
  }

  @Patch(':id/coin')
  updateCoin(
    @Param('id') id: string,
    @Body() updateCoinDto: UpdateUserCoinDto,
  ) {
    return this.usersService.updateUserCoin(id, updateCoinDto.coin);
  }

  @Patch(':id/rank')
  updateRank(
    @Param('id') id: string,
    @Body() updateRankDto: UpdateUserRankDto,
  ) {
    return this.usersService.updateUserRank(id, updateRankDto.rank_point);
  }

}
