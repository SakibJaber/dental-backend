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
import { Product } from 'src/modules/products/product.schema';

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
    @Query('procedure') procedure?: string,
    @Query('isFeatured', new ParseBoolPipe({ optional: true }))
    isFeatured?: boolean,
  ) {
    const validatedPage = page > 0 ? page : 1;
    const validatedLimit = limit > 0 && limit <= 100 ? limit : 10;
    const result = await this.productsService.findAll(
      validatedPage,
      validatedLimit,
      search,
      category,
      isFeatured,
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
        ...(procedure && { procedure }), 
        ...(isFeatured !== undefined && { isFeatured }),
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return {
      statusCode: HttpStatus.FOUND,
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

  @Patch(':id/toggle-visibility')
  async toggleVisibility(@Param('id') id: string) {
    const updated = await this.productsService.toggleVisibility(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product visibility toggled successfully',
      data: updated,
    };
  }
}
