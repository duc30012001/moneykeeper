import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BudgetPeriod } from '@prisma/client';

export class CreateBudgetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDecimal()
  @IsNotEmpty()
  amount: string;

  @IsEnum(BudgetPeriod)
  period: BudgetPeriod;

  @IsBoolean()
  @IsOptional()
  is_global?: boolean;

  @IsString()
  @IsOptional()
  category_id?: string;

  @IsString()
  @IsOptional()
  wallet_id?: string;
}

export class UpdateBudgetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDecimal()
  @IsOptional()
  amount?: string;

  @IsEnum(BudgetPeriod)
  @IsOptional()
  period?: BudgetPeriod;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}

export class ReorderItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsInt()
  sort_order: number;
}

export class ReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
