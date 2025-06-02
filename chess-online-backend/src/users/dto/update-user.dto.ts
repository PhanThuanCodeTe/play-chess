import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slogan?: string;
}

export class UpdateUserCoinDto {
  @IsNumber()
  @Min(0)
  coin: number;
}

export class UpdateUserRankDto {
  @IsNumber()
  @Min(0)
  rank_point: number;
}