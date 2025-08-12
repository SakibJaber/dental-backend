import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from 'src/modules/products/product.schema';
import { FileUploadService } from 'src/modules/file-upload/file-upload.service';
import { ProductAvailability } from 'src/common/enum/product-availability.enum';

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

      // Generate the slug using the `generateSlug` method
      const slug = this.generateSlug(createProductDto.name);

      const createdProduct = new this.productModel({
        ...createProductDto,
        imageUrl,
        slug, // Store the generated slug
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
    availability?: ProductAvailability,
    procedureType?: string,
    brand?: string,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: any = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (availability) query.availability = availability;
    if (procedureType) query.procedure = procedureType;
    if (brand) query.brand = brand;
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('brand', 'name')
        .populate('procedure', 'name')
        .exec(),
      this.productModel.countDocuments(query).exec(),
    ]);
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
      .populate('brand', 'name')
      .populate('procedure', 'name')
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

    const slug = this.generateSlug(
      updateProductDto.name || existingProduct.name,
    ); // Generate new slug

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        {
          ...updateProductDto,
          imageUrl: newImageUrls,
          slug, // Save the updated slug
        },
        { new: true },
      )
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('procedure', 'name')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Product with ID ${id} not found`,
      });
    }
    return updatedProduct;
  }

  // Utility function to generate a slug from a string
  private generateSlug(name: string): string {
    const baseUrl = 'https://example.com/products/'; // Base URL for your products
    const productSlug = slugify(name, { lower: true, strict: true }); // Convert name to slug-friendly format
    return `${baseUrl}${productSlug}`; // Concatenate base URL with the slug
  }

  async findOneBySlug(slug: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ slug: slug.toLowerCase() }) // Ensure slug query is case-insensitive
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('procedure', 'name')
      .exec();

    if (!product) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Product with slug ${slug} not found`,
      });
    }
    return product;
  }

  async getHotProducts(
    limit = 10,
    sortBy: 'sales' | 'views' | 'featured' = 'sales',
  ): Promise<Product[]> {
    let sort: any = {};
    if (sortBy === 'sales') sort = { salesCount: -1 };
    else if (sortBy === 'views') sort = { views: -1 };
    else if (sortBy === 'featured') sort = { isFeatured: -1 };

    return this.productModel
      .find({})
      .sort(sort)
      .limit(limit)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('procedure', 'name')
      .exec();
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    if (product.imageUrl?.length) {
      await Promise.all(
        product.imageUrl.map((url) => this.fileUploadService.deleteFile(url)),
      );
    }
    await this.productModel.findByIdAndDelete(id).exec();
  }
}
