import { UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileUploadInterceptor } from "src/modules/file-upload/file-upload.interceptor";

export const UseGlobalFileInterceptor = () =>
  UseInterceptors(FileUploadInterceptor.create(new ConfigService()));
