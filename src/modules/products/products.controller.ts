import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  Request,
  NotFoundException,
  BadRequestException,
  ParseIntPipe,
  HttpStatus,
  DefaultValuePipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductAvailability } from 'src/common/enum/product-availability.enum';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/user_role.enum';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productsService.create(createProductDto, files);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
    @Query('category') category?: string | string[],
    @Query('brand') brand?: string | string[],
    @Query('procedure') procedure?: string | string[],
    @Query('availability') availability?: ProductAvailability,
    @Query('isFeatured') isFeatured?: boolean,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Request() req?: any,
  ) {
    // Validate price range
    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const userId = req?.user?.id;
    return this.productsService.findAll(
      page,
      limit,
      search,
      category,
      brand,
      procedure,
      availability,
      isFeatured,
      minPrice,
      maxPrice,
      userId,
    );
  }

  @Get('hot')
  async getHotSellingProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('days') days?: number,
    @Request() req?: any,
  ) {
    if (limit > 50) {
      throw new BadRequestException('Limit cannot exceed 50');
    }
    const userId = req?.user?.id;
    return this.productsService.getHotSellingProducts(limit, days, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req?: any) {
    const userId = req?.user?.id; // Will be undefined if not logged in
    return this.productsService.findOne(id, userId);
  }

  @Get('byid/:productId')
  async findOneByProductId(
    // If productId is guaranteed to be a UUID v4, use ParseUUIDPipe:
    // @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Param('productId') productId: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.productsService.findOneByProductId(productId, userId);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productsService.update(id, updateProductDto, files);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('images', 10))
  async addImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }
    return this.productsService.addImages(id, files);
  }

  @Delete(':id/images/:index')
  async removeImage(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
  ) {
    if (index < 0) {
      throw new BadRequestException('Invalid image index');
    }
    return this.productsService.removeImage(id, index);
  }

  @Patch(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body('stock', ParseIntPipe) stock: number,
  ) {
    if (stock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }
    return this.productsService.updateStock(id, stock);
  }

  @Patch(':id/sales')
  async incrementSales(
    @Param('id') id: string,
    @Body('quantity', new DefaultValuePipe(1), ParseIntPipe) quantity: number,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    return this.productsService.incrementSales(id, quantity);
  }

  @Patch(':id/featured')
  async toggleFeatured(@Param('id') id: string) {
    return this.productsService.toggleFeatured(id);
  }

  @Get('featured')
  async getFeaturedProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      throw new BadRequestException('Limit cannot exceed 50');
    }
    return this.productsService.getFeaturedProducts(limit);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product deleted successfully',
    };
  }

  @Get('analytics/sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getSalesAnalytics(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (days > 365) {
      throw new BadRequestException('Date range cannot exceed 365 days');
    }
    if (limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }
    return this.productsService.getSalesAnalytics(days, limit);
  }

  @Get(':id/related')
  async getRelatedProducts(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
    @Request() req?: any,
  ) {
    if (limit > 20) {
      throw new BadRequestException('Limit cannot exceed 20');
    }
    const userId = req?.user?.id;
    return this.productsService.getRelatedProducts(id, limit, userId);
  }

  @Get(':id/frequently-bought-together')
  async getFrequentlyBoughtTogether(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(4), ParseIntPipe) limit: number,
    @Request() req?: any,
  ) {
    if (limit > 10) {
      throw new BadRequestException('Limit cannot exceed 10');
    }
    const userId = req?.user?.id;
    return this.productsService.getFrequentlyBoughtTogether(id, limit, userId);
  }
}
