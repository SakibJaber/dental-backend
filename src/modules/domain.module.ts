import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BrandModule } from 'src/modules/brand/brand.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';
import { SliderModule } from './slider/slider.module';
import { AddressModule } from './address/address.module';
import { LegalPageModule } from './legal-page/legal-page.module';
import { ContactInfoModule } from 'src/modules/contacts/contact-info/contact-info.module';
import { ContactModule } from 'src/modules/contacts/contact/contact.module';
import { ProcedureModule } from './procedure/procedure.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    BrandModule,
    SliderModule,
    AddressModule,
    LegalPageModule,
    ContactInfoModule,
    ContactModule,
    ProcedureModule,
  ],
  controllers: [],
  providers: [],
})
export class DomainModule {}
