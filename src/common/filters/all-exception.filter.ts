import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileUploadService } from '../../modules/file-upload/file-upload.service';
import { MongoServerError } from 'mongodb';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly fileUploadService: FileUploadService) {}

  private getUploadedFiles(request: Request): Express.Multer.File[] {
    if (request.file) return [request.file];
    if (request.files) {
      return Array.isArray(request.files)
        ? request.files as Express.Multer.File[]
        : (Object.values(request.files).flat() as Express.Multer.File[]);
    }
    return [];
  }

  private async cleanupFiles(files: Express.Multer.File[]) {
    await Promise.all(
      files.map(async (file) => {
        try {
          if (file['location']) {
            await this.fileUploadService.deleteFile(file['location']);
          } else if (file.path) {
            await this.fileUploadService.deleteFile(file.path);
          }
        } catch (e) {
          this.logger.error(`File cleanup error: ${e.message}`);
        }
      })
    );
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const uploadedFiles = this.getUploadedFiles(request);

    // Handle MongoDB duplicate key error silently
    if (
      exception instanceof MongoServerError ||
      exception?.code === 11000 ||
      (exception?.message && exception.message.includes('E11000'))
    ) {
      // Extract duplicate key information
      const keyValue = exception.keyValue || {};
      const key = Object.keys(keyValue)[0] || 'field';
      const value = keyValue[key] || 'value';
      
      // Cleanup uploaded files before responding
      return this.cleanupFiles(uploadedFiles).then(() => {
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: `${key} '${value}' already exists.`,
          error: 'Conflict',
          path: request.url,
        });
      });
    }

    // Handle HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : typeof res === 'object' && (res as any)?.message
            ? (res as any).message
            : exception.message;

      return this.cleanupFiles(uploadedFiles).then(() => {
        response.status(status).json({
          statusCode: status,
          message,
          error: exception.name,
          path: request.url,
        });
      });
    }

    // Log other errors
    this.logger.error(
      `Unhandled exception: ${exception.message}`,
      exception.stack
    );

    // Handle other errors
    return this.cleanupFiles(uploadedFiles).then(() => {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'InternalServerError',
        path: request.url,
      });
    });
  }
}