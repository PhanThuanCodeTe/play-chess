import { Controller, Post, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  // @UseInterceptors(
  //   FilesInterceptor('files', 3, { // Giới hạn tối đa 3 file
  //     storage: diskStorage({
  //       destination: './uploads', // Thư mục lưu file
  //       filename: (req, file, callback) => {
  //         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         const ext = extname(file.originalname);
  //         callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  //       },
  //     }),
  //     fileFilter: (req, file, callback) => {
  //       // Chỉ cho phép file hình ảnh (jpg, jpeg, png, gif)
  //       if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
  //         return callback(new Error('Chỉ cho phép file hình ảnh!'), false);
  //       }
  //       callback(null, true);
  //     },
  //     limits: {
  //       fileSize: 1024 * 1024 * 5, // Giới hạn 5MB mỗi file
  //     },
  //   }),
  // )
  // uploadFiles(
  //   @UploadedFiles() files: Express.Multer.File[],
  //   @Body() body: any,
  // ) {
  //   // Xử lý các file
  //   const fileResponse = files.map(file => ({
  //     field: file.fieldname,
  //     originalname: file.originalname,
  //     filename: file.filename,
  //     path: file.path,
  //   }));

  //   // Xử lý các trường text
  //   const textData = {
  //     email: body.email,
  //     password: body.password,
  //     name: body.name,
  //     slogan: body.slogan,
  //   };

  //   return {
  //     message: 'Dữ liệu đã được nhận thành công',
  //     files: fileResponse,
  //     textData: textData,
  //   };
  // }

  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

}
