import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ApiResponse, api } from 'src/common/utils/api-respone.util';

@Injectable()
export class UsersService {

  constructor( // constructor
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<ApiResponse> { // create user method
    const { email, password, name, avatar_url, slogan, avatar_frame, background_image } = createUserDto; 

    const existingUser = await this.userRepository.findOne({ where: { email } }); // check mail if it exist res back
    if (existingUser) {
      return api()
        .setError('Email already exists')
        .build();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      avatar_url,
      slogan,
      avatar_frame,
      background_image
    });

    const newUser = await this.userRepository.save(user);

    const responseRegisteredUser = {
      email: newUser.email,
      full_name: newUser.name,
      avatar_url: newUser.avatar_url,
      background_image: newUser.background_image,
      avatar_frame: newUser.avatar_frame,
      slogan: newUser.slogan
    }; // return exact column not all

    return api() // api respone
      .setMessage('User created successfully')
      .setResponse(responseRegisteredUser)
      .build();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id: id.toString() } 
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

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
