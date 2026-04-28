import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';
import { MeModule } from './me/me.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    // .env is loaded in main.ts before this module is imported, so we just
    // expose a global ConfigService for typed access.
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    PrismaModule,
    CategoriesModule,
    ProductsModule,
    MeModule,
    OrdersModule,
  ],
})
export class AppModule {}
