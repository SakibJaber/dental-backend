import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFiles,
  HttpStatus,
  DefaultValuePipe,
  ParseBoolPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UseGlobalFileInterceptor } from 'src/common/decorator/globalFileInterceptor.decorator';
import { ProductAvailability } from 'src/common/enum/product-availability.enum';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGlobalFileInterceptor({ fieldName: 'images', maxCount: 5 })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const product = await this.productsService.create(createProductDto, files);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Product created successfully',
      data: product,
    };
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('procedureType') procedureType?: string,
    @Query('brand') brand?: string,
    @Query('availability') availability?: ProductAvailability,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    const result = await this.productsService.findAll(
      page,
      limit,
      search,
      category,
      availability,
      procedureType,
      brand,
      minPrice,
      maxPrice,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Products fetched successfully',
      data: result.data,
      meta: {
        // Pagination and filtering metadata
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        // Include filter information for clarity in the response
        ...(search && { search }),
        ...(category && { category }),
        ...(procedureType && { procedureType }),
        ...(brand && { brand }),
        ...(availability && { availability }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      },
    };
  }

  @Get('hot')
  async getHotProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy?: 'sales' | 'views' | 'featured',
  ) {
    // You can add more sorting options as needed
    const hotProducts = await this.productsService.getHotProducts(
      limit,
      sortBy,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Hot products fetched successfully',
      data: hotProducts,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product fetched successfully',
      data: product,
    };
  }

  @Patch(':id')
  @UseGlobalFileInterceptor({ fieldName: 'images', maxCount: 5 })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const updated = await this.productsService.update(
      id,
      updateProductDto,
      files,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Product updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product deleted successfully',
    };
  }
}
