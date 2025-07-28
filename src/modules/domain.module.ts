import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BrandModule } from 'src/modules/brand/brand.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';
import { SliderModule } from './slider/slider.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    BrandModule,
    SliderModule,
  ],
  controllers: [],
  providers: [],
})
export class DomainModule {}
