import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from 'src/modules/products/product.schema';
import { FileUploadService } from 'src/modules/file-upload/file-upload.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<Product> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No files uploaded',
        });
      }

      const imageUrl = await Promise.all(
        files.map((file) => this.fileUploadService.handleUpload(file)),
      );

      const createdProduct = new this.productModel({
        ...createProductDto,
        imageUrl,
      });

      return createdProduct.save();
    } catch (error) {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Product creation failed',
      });
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    category?: string,
    isFeatured?: boolean,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = { isVisible: true }; // Start with default visibility filter

    // Add search filter if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search on product name
    }

    // Add category filter if provided
    if (category) {
      query.category = category; // Assuming category is stored as an ObjectId or direct string
    }

    // Add isFeatured filter if provided (handles true/false/undefined)
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute count and find queries concurrently for better performance
    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name') // Populate the category field, only returning its 'name'
        .exec(),
      this.productModel.countDocuments(query).exec(), // Get total count based on all filters
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
  
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name')
      .exec();

    if (!product) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Product with ID ${id} not found`,
      });
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[],
  ): Promise<Product> {
    const existingProduct = await this.findOne(id);
    let newImageUrls = existingProduct.imageUrl;

    if (files && files.length > 0) {
      if (existingProduct.imageUrl?.length) {
        await Promise.all(
          existingProduct.imageUrl.map((url) =>
            this.fileUploadService.deleteFile(url),
          ),
        );
      }

      newImageUrls = await Promise.all(
        files.map((file) => this.fileUploadService.handleUpload(file)),
      );
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        {
          ...updateProductDto,
          imageUrl: newImageUrls,
        },
        { new: true },
      )
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Product with ID ${id} not found`,
      });
    }

    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const result = await this.findOne(id);

    if (result.imageUrl?.length) {
      await Promise.all(
        result.imageUrl.map((url) => this.fileUploadService.deleteFile(url)),
      );
    }

    await this.productModel.findByIdAndDelete(id).exec();
  }

  async toggleVisibility(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Product with ID ${id} not found`,
      });
    }

    product.isVisible = !product.isVisible;
    return product.save();
  }
}