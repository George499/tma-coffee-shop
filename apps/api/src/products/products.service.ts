import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListProductsDto } from './dto/list-products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: ListProductsDto) {
    return this.prisma.product.findMany({
      where: {
        isAvailable: true,
        ...(query.categoryId !== undefined && { categoryId: query.categoryId }),
      },
      orderBy: [{ categoryId: 'asc' }, { id: 'asc' }],
    });
  }
}
