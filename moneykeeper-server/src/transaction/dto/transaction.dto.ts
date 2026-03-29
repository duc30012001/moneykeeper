import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsDecimal()
  @IsNotEmpty()
  amount: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @IsOptional()
  note?: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  wallet_id: string;

  @IsString()
  @IsOptional()
  to_wallet_id?: string;

  @IsString()
  @IsOptional()
  category_id?: string;
}

export class UpdateTransactionDto {
  @IsDecimal()
  @IsOptional()
  amount?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  category_id?: string;
}

export class TransactionQueryDto {
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsString()
  @IsOptional()
  wallet_id?: string;

  @IsString()
  @IsOptional()
  category_id?: string;

  @IsDateString()
  @IsOptional()
  from_date?: string;

  @IsDateString()
  @IsOptional()
  to_date?: string;
}
