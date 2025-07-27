import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [UsersModule, AuthModule, CategoriesModule, ProductsModule],
  controllers: [],
  providers: [],
})
export class DomainModule {}
