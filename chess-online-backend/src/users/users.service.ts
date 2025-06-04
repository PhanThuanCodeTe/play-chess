import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ApiResponse, api } from 'src/common/utils/api-respone.util';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { 
  calculateRankName, 
  generateRandomAvatar, 
  generateRandomFrame, 
  generateRandomBackground 
} from 'src/common/utils/user-option.util';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<ApiResponse> {
    const { email, password, name, slogan } = createUserDto; 

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      return api()
        .setError('Email already exists')
        .build();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate random images
    const avatar_url = generateRandomAvatar();
    const avatar_frame = generateRandomFrame();
    const background_image = await generateRandomBackground();

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      avatar_url,
      slogan: slogan || '',
      avatar_frame,
      background_image,
      rank_point: 0,
      rank_name: calculateRankName(0),
    });

    const newUser = await this.userRepository.save(user);

    const responseRegisteredUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar_url: newUser.avatar_url,
      background_image: newUser.background_image,
      avatar_frame: newUser.avatar_frame,
      slogan: newUser.slogan,
      rank_point: newUser.rank_point,
      rank_name: newUser.rank_name,
    };

    return api()
      .setMessage('User created successfully')
      .setResponse(responseRegisteredUser)
      .build();
  }

  async getUserProfile(id: string): Promise<ApiResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return api()
        .setError('User not found')
        .build();
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      slogan: user.slogan,
      avatar_url: user.avatar_url,
      avatar_frame: user.avatar_frame,
      background_image: user.background_image,
      rank_point: user.rank_point,
      rank_name: user.rank_name,
      total_game: user.total_game,
      win_match: user.win_match,
      win_rate: user.win_rate,
      coin: user.coin,
      status: user.status,
      last_active: user.last_active,
      created_at: user.created_at,
    };

    return api()
      .setMessage('User profile retrieved successfully')
      .setResponse(userProfile)
      .build();
  }

  async updateUserProfile(
    id: string, 
    updateUserDto: UpdateUserDto, 
    files?: Express.Multer.File[]
  ): Promise<ApiResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return api()
        .setError('User not found')
        .build();
    }

    // Update text fields
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.slogan !== undefined) user.slogan = updateUserDto.slogan;

    // Handle file uploads
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const imageUrl = await this.cloudinaryService.uploadImage(file, 'chess-app/users');
          
          // Determine file type based on fieldname or original filename
          const fieldName = file.fieldname || file.originalname.toLowerCase();
          
          if (fieldName.includes('avatar') && !fieldName.includes('frame')) {
            user.avatar_url = imageUrl;
          } else if (fieldName.includes('frame')) {
            user.avatar_frame = imageUrl;
          } else if (fieldName.includes('background')) {
            user.background_image = imageUrl;
          } else {
            // Default assignment based on order if fieldname is generic
            if (!user.avatar_url.includes('cloudinary')) {
              user.avatar_url = imageUrl;
            } else if (!user.avatar_frame.includes('cloudinary')) {
              user.avatar_frame = imageUrl;
            } else {
              user.background_image = imageUrl;
            }
          }
        } catch (error) {
          return api()
            .setError(`Failed to upload ${file.fieldname}: ${error.message}`)
            .build();
        }
      }
    }

    user.updated_at = new Date();
    const updatedUser = await this.userRepository.save(user);

    const responseData = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar_url: updatedUser.avatar_url,
      background_image: updatedUser.background_image,
      avatar_frame: updatedUser.avatar_frame,
      slogan: updatedUser.slogan,
      rank_point: updatedUser.rank_point,
      rank_name: updatedUser.rank_name,
      coin: updatedUser.coin,
      updated_at: updatedUser.updated_at,
    };

    return api()
      .setMessage('User profile updated successfully')
      .setResponse(responseData)
      .build();
  }

  async updateUserCoin(id: string, coin: number): Promise<ApiResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return api()
        .setError('User not found')
        .build();
    }

    user.coin = coin;
    user.updated_at = new Date();
    const updatedUser = await this.userRepository.save(user);

    return api()
      .setMessage('User coin updated successfully')
      .setResponse({ coin: updatedUser.coin })
      .build();
  }

  async updateUserRank(id: string, rankPoint: number): Promise<ApiResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return api()
        .setError('User not found')
        .build();
    }

    user.rank_point = rankPoint;
    user.rank_name = calculateRankName(rankPoint);
    user.updated_at = new Date();
    const updatedUser = await this.userRepository.save(user);

    return api()
      .setMessage('User rank updated successfully')
      .setResponse({ 
        rank_point: updatedUser.rank_point,
        rank_name: updatedUser.rank_name
      })
      .build();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, { 
      password: hashedPassword,
      updated_at: new Date()
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Legacy methods for backward compatibility
  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}