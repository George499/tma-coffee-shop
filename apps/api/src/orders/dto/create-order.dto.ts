import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DeliveryType } from '@tma-coffee-shop/shared';

export class CreateOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  productId!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsEnum(DeliveryType)
  deliveryType!: DeliveryType;

  @ValidateIf((o: CreateOrderDto) => o.deliveryType === DeliveryType.DELIVERY)
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  address?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  customerName!: string;

  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'customerPhone must be 7-20 chars: digits, spaces, +, -, ()',
  })
  customerPhone!: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
