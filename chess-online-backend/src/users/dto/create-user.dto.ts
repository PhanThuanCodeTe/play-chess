import { IsEmail, IsNotEmpty, IsString, IsOptional, isString } from 'class-validator';
export class CreateUserDto {
    
    @IsEmail()
    email: string;
  
    @IsString()
    @IsNotEmpty()
    password: string;
  
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsOptional()
    @IsString()
    avatar_url?: string;

    @IsOptional()
    @IsString()
    slogan?: string;

    @IsOptional()
    @IsString()
    avatar_frame?: string;

    @IsOptional()
    @IsString()
    background_image?: string;

}
