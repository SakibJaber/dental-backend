import {
  FileInterceptor,
  FilesInterceptor,
  AnyFilesInterceptor,
} from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { FileInterceptorOptions } from 'src/modules/file-upload/types/file-upload-options.interface';

export function GlobalFileUploadInterceptor(
  options: FileInterceptorOptions = {},
) {
  const field = options.fieldName || 'file';
  const maxCount = options.maxCount ?? 1;
  const isMultiple = maxCount > 1;
  const isAny = options.any === true;

  const configService = new ConfigService();

  const storageType = configService.get<string>('FILE_STORAGE', 'local');
  let storage: multer.StorageEngine;

  if (storageType === 's3') {
    const s3 = new S3Client({
      region: configService.get<string>('AWS_REGION')!,
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });

    storage = multerS3({
      s3,
      bucket: configService.get<string>('AWS_S3_BUCKET')!,
      key: (req, file, cb) => {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, `uploads/${fileName}`);
      },
    });
  } else {
    const uploadPath = configService.get<string>(
      'LOCAL_UPLOAD_PATH',
      './public/uploads',
    );
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadPath),
      filename: (req, file, cb) => {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, fileName);
      },
    });
  }

  const fileFilter = (
    req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      cb(null, true);
    } else {
      cb(
        new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname),
        false,
      );
    }
  };

  const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

  if (isAny) {
    return AnyFilesInterceptor({ storage, limits, fileFilter });
  }

  if (isMultiple) {
    return FilesInterceptor(field, maxCount, { storage, limits, fileFilter });
  }

  return FileInterceptor(field, { storage, limits, fileFilter });
}
