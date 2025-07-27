import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class FileUploadService {
  private s3: S3Client;
  private useS3: boolean;
  private localUploadPath: string;

  constructor(private configService: ConfigService) {
    this.useS3 = configService.get<string>('FILE_STORAGE') === 's3';
    this.localUploadPath = path.join(
      process.cwd(),
      configService.get<string>('LOCAL_UPLOAD_PATH', 'public/uploads'),
    );

    if (this.useS3) {
      this.s3 = new S3Client({
        region: configService.get<string>('AWS_REGION')!,
        credentials: {
          accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
          secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
        },
      });
    }
  }

  async handleUpload(file: Express.Multer.File): Promise<string> {
    try {
      if (this.useS3) {
        return (file as any).location;
      }

      if (file.path) {
        const fileName = path.basename(file.path);
        return `/uploads/${fileName}`;
      }

      if (file.buffer) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(this.localUploadPath, fileName);
        await fs.writeFile(filePath, file.buffer);
        return `/uploads/${fileName}`;
      }

      throw new Error('No file data available');
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to save file');
    }
  }

  async deleteFile(fileIdentifier: string) {
    if (!fileIdentifier) return;

    try {
      if (this.useS3) {
        // Handle both full URLs and S3 keys
        let key = fileIdentifier;
        if (fileIdentifier.startsWith('https://')) {
          const url = new URL(fileIdentifier);
          key = decodeURIComponent(url.pathname.slice(1));
        }

        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: this.configService.get<string>('AWS_S3_BUCKET')!,
            Key: key,
          }),
        );
      } else {
        // Handle both file paths and public URLs
        let filePath = fileIdentifier;
        if (fileIdentifier.startsWith('/uploads/')) {
          filePath = path.join(
            this.localUploadPath,
            path.basename(fileIdentifier),
          );
        }
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`File deletion error: ${error.message}`);
      throw new InternalServerErrorException('File deletion failed');
    }
  }
}
