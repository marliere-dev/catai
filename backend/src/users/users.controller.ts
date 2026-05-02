import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentFirebaseUser } from '../auth/decorators/current-firebase-user.decorator';
import { FirebaseUser } from '../auth/auth.types';
import { UpdateMeDto } from './dto/update-me.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('me')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async me(@CurrentFirebaseUser() firebaseUser: FirebaseUser): Promise<User> {
    return this.users.ensureFromFirebase(firebaseUser);
  }

  @Patch()
  async updateMe(
    @CurrentFirebaseUser() firebaseUser: FirebaseUser,
    @Body() dto: UpdateMeDto,
  ): Promise<User> {
    const user = await this.users.ensureFromFirebase(firebaseUser);
    return this.users.update(user, dto);
  }
}
