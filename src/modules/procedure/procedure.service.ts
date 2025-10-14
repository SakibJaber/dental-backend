import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Procedure } from './procedure.schema';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { Product } from 'src/modules/products/schema/product.schema';

@Injectable()
export class ProceduresService {
  constructor(
    @InjectModel(Procedure.name)
    private readonly procedureModel: Model<Procedure>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(
    dto: CreateProcedureDto,
    file?: Express.Multer.File,
  ): Promise<Procedure> {
    try {
      const imageUrl = file
        ? await this.fileUploadService.handleUpload(file)
        : dto.imageUrl;

      const created = new this.procedureModel({
        ...dto,
        imageUrl,
      });

      return await created.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          'Procedure with this name already exists',
        );
      }
      throw new InternalServerErrorException('Failed to create procedure');
    }
  }

  async findAll(): Promise<Procedure[]> {
    return this.procedureModel.find().lean();
  }

  async findOne(id: string): Promise<any> {
    const procedure = await this.procedureModel.findById(id).lean();
    if (!procedure) {
      throw new NotFoundException(`Procedure with ID ${id} not found`);
    }

    const products = await this.productModel.find({ procedure: id }).lean();

    return {
      ...procedure,
      products,
    };
  }

  async update(
    id: string,
    dto: UpdateProcedureDto,
    file?: Express.Multer.File,
  ): Promise<Procedure> {
    const existing = await this.procedureModel.findById(id);
    if (!existing) {
      throw new NotFoundException(`Procedure with ID ${id} not found`);
    }

    try {
      let imageUrl = dto.imageUrl || existing.imageUrl;

      if (file) {
        if (existing.imageUrl) {
          await this.fileUploadService.deleteFile(existing.imageUrl);
        }
        imageUrl = await this.fileUploadService.handleUpload(file);
      }

      const updated = await this.procedureModel.findByIdAndUpdate(
        id,
        { ...dto, imageUrl },
        { new: true },
      );

      if (!updated) {
        throw new NotFoundException(`Procedure with ID ${id} not found`);
      }

      return updated;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          'Procedure with this name already exists',
        );
      }
      throw new InternalServerErrorException('Failed to update procedure');
    }
  }

  async remove(id: string): Promise<void> {
    const procedure = await this.procedureModel.findById(id);
    if (!procedure) {
      throw new NotFoundException(`Procedure with ID ${id} not found`);
    }

    if (procedure.imageUrl) {
      await this.fileUploadService.deleteFile(procedure.imageUrl);
    }

    await this.procedureModel.findByIdAndDelete(id);
  }
}
