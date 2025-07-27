import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [UsersModule, AuthModule, CategoriesModule],
  controllers: [],
  providers: [],
})
export class DomainModule {}
