import { Body, Controller, ForbiddenException, Get, Patch, UseGuards } from '@nestjs/common';

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
    // Per-field gate: setting `role` requires a verified email (§119). Other
    // fields like `name` stay editable before verification, so we cannot use
    // the route-wide @RequireEmailVerified() decorator here.
    if (dto.role !== undefined && !firebaseUser.emailVerified) {
      throw new ForbiddenException('Email must be verified before choosing a role');
    }
    const user = await this.users.ensureFromFirebase(firebaseUser);
    return this.users.update(user, dto);
  }
}
