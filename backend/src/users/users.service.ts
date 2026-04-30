import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FirebaseUser } from '../auth/auth.types';
import { UpdateMeDto } from './dto/update-me.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async ensureFromFirebase(firebaseUser: FirebaseUser): Promise<User> {
    const existing = await this.users.findOne({ where: { firebaseUid: firebaseUser.uid } });
    if (existing) {
      if (existing.email !== firebaseUser.email) {
        existing.email = firebaseUser.email;
        await this.users.save(existing);
      }
      return existing;
    }
    const created = this.users.create({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.email.split('@')[0] ?? 'User',
      role: null,
      disabledAt: null,
    });
    return this.users.save(created);
  }

  async update(user: User, dto: UpdateMeDto): Promise<User> {
    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    if (dto.role !== undefined) {
      if (user.role !== null && user.role !== dto.role) {
        throw new ConflictException('Role cannot be changed once set');
      }
      user.role = dto.role;
    }
    return this.users.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
