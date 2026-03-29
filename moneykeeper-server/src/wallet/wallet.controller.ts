import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { WalletService } from './wallet.service';
import { CreateWalletDto, UpdateWalletDto } from './dto';
import { ReorderDto } from '../budget/dto';
import { CurrentUser } from '../auth/decorators';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.walletService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.walletService.findOne(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateWalletDto, @CurrentUser() user: User) {
    return this.walletService.create(dto, user.id);
  }

  @Put('reorder')
  reorder(@Body() dto: ReorderDto, @CurrentUser() user: User) {
    return this.walletService.reorder(dto.items, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWalletDto,
    @CurrentUser() user: User,
  ) {
    return this.walletService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.walletService.remove(id, user.id);
  }
}
