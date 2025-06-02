import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from '../configs/cloudinary.config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinaryConfig(this.configService);
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'chess-app'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'limit', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result && result.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Image upload failed: No result or secure_url returned.'));
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}