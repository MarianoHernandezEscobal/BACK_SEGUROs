import {
  Body,
  Controller,
  Post,
  Put,
  Param,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { AuthGuard } from '../guards/auth.guard';

@Controller('users')
export class UserController {

  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() body: {
    name: string;
    email: string;
    password: string;
  }) {
    return this.userService.createUser(body);
  }

  @Post('login')
  login(@Body() body: {
    email: string;
    password: string;
  }) {
    return this.userService.login(body.email, body.password);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  updateUser(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      admin?: boolean;
    },
  ) {
    return this.userService.updateUser(id, body);
  }

  @Put(':id/admin')
  @UseGuards(AuthorizationGuard)
  makeAdmin(@Param('id') id: string) {
    return this.userService.makeAdmin(id);
  }
}