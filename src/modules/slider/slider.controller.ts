import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { SliderService } from './slider.service';
import { UseGlobalFileInterceptor } from 'src/common/decorator/globalFileInterceptor.decorator';

@Controller('sliders')
export class SliderController {
  constructor(private readonly sliderService: SliderService) {}

  @Post()
  @UseGlobalFileInterceptor({ fieldName: 'image' })
  async create(@UploadedFile() file: Express.Multer.File) {
    const slider = await this.sliderService.create(file);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Slider created successfully',
      data: slider,
    };
  }

  @Get()
  async findAll() {
    const sliders = await this.sliderService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Sliders fetched successfully',
      data: sliders,
    };
  }

  @Patch(':id')
  @UseGlobalFileInterceptor({ fieldName: 'image' })
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const updated = await this.sliderService.update(id, file);
    return {
      statusCode: HttpStatus.OK,
      message: 'Slider updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.sliderService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Slider deleted successfully',
    };
  }
}
