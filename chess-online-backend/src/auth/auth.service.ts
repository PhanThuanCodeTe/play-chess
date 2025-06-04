import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ApiResponse, api } from '../common/utils/api-respone.util';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<ApiResponse> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);

    return api()
      .setMessage('Login successful')
      .setResponse({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: '1d',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          rank_name: user.rank_name,
          rank_point: user.rank_point,
        }
      })
      .build();
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<ApiResponse> {
    const user = await this.usersService.findByEmail(''); // Will fix this
    if (!user) {
      return api().setError('User not found').build();
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return api().setError('Old password is incorrect').build();
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashedNewPassword);

    return api()
      .setMessage('Password changed successfully')
      .setResponse(null)
      .build();
  }
}