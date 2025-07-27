import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileUploadService } from 'src/modules/file-upload/file-upload.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    file: Express.Multer.File,
  ): Promise<Category> {
    try {
      if (!file) {
        throw new Error('No file uploaded');
      }

      const imageUrl = await this.fileUploadService.handleUpload(file);

      const category = new this.categoryModel({
        name: createCategoryDto.name,
        imageUrl,
      });

      return await category.save();
    } catch (error) {
      console.error('Create category error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    file: Express.Multer.File,
  ): Promise<Category> {
    const existingCategory = await this.findOne(id);
    let newImageUrl = existingCategory.imageUrl;

    if (file) {
      newImageUrl = await this.fileUploadService.handleUpload(file);
      if (existingCategory.imageUrl) {
        await this.fileUploadService.deleteFile(existingCategory.imageUrl);
      }
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, {
        name: updateCategoryDto.name || existingCategory.name,
        imageUrl: newImageUrl,
      }, { new: true })
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return updatedCategory;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    if (category.imageUrl) {
      await this.fileUploadService.deleteFile(category.imageUrl);
    }
    await this.categoryModel.findByIdAndDelete(id).exec();
  }
}
