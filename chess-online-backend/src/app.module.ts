import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { getDatabaseConfig } from './common/configs/database.config';
import { CloudinaryService } from './common/services/cloudinary.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RoomsModule } from './rooms/rooms.module';
import { GamesModule } from './games/games.module';
import { AchievementsModule } from './achievements/achievements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config available globally
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    RoomsModule,
    GamesModule,
    AchievementsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CloudinaryService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Áp dụng JWT guard globally
    },
  ],
  exports: [CloudinaryService],
})
export class AppModule {}