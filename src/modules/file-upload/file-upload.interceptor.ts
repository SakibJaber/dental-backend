import { FileInterceptor } from '@nestjs/platform-express';
import { Injectable, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadInterceptor {
  static create(configService: ConfigService) {
    const storageType = configService.get<string>('FILE_STORAGE', 'local');

    if (storageType === 's3') {
      const s3 = new S3Client({
        region: configService.get<string>('AWS_REGION')!,
        credentials: {
          accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
          secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
        },
      });

      return FileInterceptor('image', {
        storage: multerS3({
          s3,
          bucket: configService.get<string>('AWS_S3_BUCKET')!,
          key: (req, file, cb) => {
            const fileName = `${Date.now()}-${file.originalname}`;
            cb(null, `uploads/${fileName}`);
          },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            cb(null, true);
          } else {
            cb(new Error('Unsupported file type'), false);
          }
        },
      });
    }

    // Local storage
    const uploadPath = configService.get<string>('LOCAL_UPLOAD_PATH', './public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    return FileInterceptor('image', {
      storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadPath),
        filename: (req, file, cb) => {
          const fileName = `${Date.now()}-${file.originalname}`;
          cb(null, fileName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file type'), false);
        }
      },
    });
  }
}
