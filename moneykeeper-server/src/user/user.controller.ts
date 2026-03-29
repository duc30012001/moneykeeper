import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser, Roles } from '../auth/decorators';
import { User, Role } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get()
  @Roles(Role.admin)
  findAll() {
    return this.userService.findAll();
  }
}
