import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { ProceduresService } from './procedure.service';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { UseGlobalFileInterceptor } from '../../common/decorator/globalFileInterceptor.decorator';

@Controller('procedures')
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Post()
  @UseGlobalFileInterceptor({ fieldName: 'image' })
  async create(
    @Body() dto: CreateProcedureDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const procedure = await this.proceduresService.create(dto, file);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Procedure created successfully',
      data: procedure,
    };
  }

  @Get()
  async findAll() {
    const procedures = await this.proceduresService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Procedures fetched successfully',
      data: procedures,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const procedure = await this.proceduresService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Procedure fetched successfully',
      data: procedure,
    };
  }

  @Patch(':id')
  @UseGlobalFileInterceptor({ fieldName: 'image' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProcedureDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const updated = await this.proceduresService.update(id, dto, file);
    return {
      statusCode: HttpStatus.OK,
      message: 'Procedure updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.proceduresService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Procedure deleted successfully',
    };
  }
}
