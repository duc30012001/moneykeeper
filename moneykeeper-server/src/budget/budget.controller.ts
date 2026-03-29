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
import { BudgetService } from './budget.service';
import { CreateBudgetDto, ReorderDto, UpdateBudgetDto } from './dto';
import { CurrentUser } from '../auth/decorators';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.budgetService.findAll(user.id);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: User) {
    return this.budgetService.getBudgetSummary(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.budgetService.findOne(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateBudgetDto, @CurrentUser() user: User) {
    return this.budgetService.create(dto, user.id);
  }

  @Put('reorder')
  reorder(@Body() dto: ReorderDto, @CurrentUser() user: User) {
    return this.budgetService.reorder(dto.items, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @CurrentUser() user: User,
  ) {
    return this.budgetService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.budgetService.remove(id, user.id);
  }
}
