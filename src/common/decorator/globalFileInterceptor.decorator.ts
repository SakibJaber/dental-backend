import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { GlobalFileUploadInterceptor } from 'src/modules/file-upload/file-upload.interceptor';
import { FileInterceptorOptions } from 'src/modules/file-upload/types/file-upload-options.interface';


/**
 * Usage:
 * - Single: @UseGlobalFileInterceptor({ fieldName: 'image' })
 * - Multiple: @UseGlobalFileInterceptor({ fieldName: 'images', maxCount: 5 })
 * - Any: @UseGlobalFileInterceptor({ any: true })
 */
export function UseGlobalFileInterceptor(options: FileInterceptorOptions = {}) {
  return applyDecorators(UseInterceptors(GlobalFileUploadInterceptor(options)));
}
