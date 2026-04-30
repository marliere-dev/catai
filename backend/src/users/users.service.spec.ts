import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { UpdateMeDto } from './dto/update-me.dto';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';
import { UsersService } from './users.service';

class InMemoryUsersRepository {
  private rows: User[] = [];
  private nextId = 1;

  create(partial: Partial<User>): User {
    return { ...partial } as User;
  }

  async findOne(args: { where: Partial<User> }): Promise<User | null> {
    const where = args.where;
    return (
      this.rows.find((row) =>
        (Object.keys(where) as Array<keyof User>).every((k) => row[k] === where[k]),
      ) ?? null
    );
  }

  async save(entity: User): Promise<User> {
    if (!entity.id) {
      entity.id = `user-${this.nextId++}`;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      this.rows.push(entity);
      return entity;
    }
    const idx = this.rows.findIndex((r) => r.id === entity.id);
    if (idx === -1) {
      this.rows.push(entity);
    } else {
      this.rows[idx] = { ...entity, updatedAt: new Date() };
    }
    return this.rows[idx === -1 ? this.rows.length - 1 : idx];
  }

  snapshot(): User[] {
    return [...this.rows];
  }
}

function buildService(): { service: UsersService; repo: InMemoryUsersRepository } {
  const repo = new InMemoryUsersRepository();
  const service = new UsersService(repo as unknown as Repository<User>);
  return { service, repo };
}

describe('UsersService', () => {
  describe('ensureFromFirebase', () => {
    it('creates a single user on the first call', async () => {
      const { service, repo } = buildService();
      const created = await service.ensureFromFirebase({
        uid: 'fb-1',
        email: 'a@example.com',
        emailVerified: true,
      });

      expect(created.firebaseUid).toBe('fb-1');
      expect(created.email).toBe('a@example.com');
      expect(created.role).toBeNull();
      expect(repo.snapshot()).toHaveLength(1);
    });

    it('does not create a duplicate when called twice for the same firebase uid', async () => {
      const { service, repo } = buildService();
      await service.ensureFromFirebase({
        uid: 'fb-1',
        email: 'a@example.com',
        emailVerified: true,
      });
      await service.ensureFromFirebase({
        uid: 'fb-1',
        email: 'a@example.com',
        emailVerified: true,
      });
      expect(repo.snapshot()).toHaveLength(1);
    });

    it('updates the email if it changed in Firebase', async () => {
      const { service } = buildService();
      await service.ensureFromFirebase({
        uid: 'fb-1',
        email: 'old@example.com',
        emailVerified: true,
      });
      const refreshed = await service.ensureFromFirebase({
        uid: 'fb-1',
        email: 'new@example.com',
        emailVerified: true,
      });
      expect(refreshed.email).toBe('new@example.com');
    });
  });

  describe('update', () => {
    it('sets the role on the first call', async () => {
      const { service } = buildService();
      const user = await service.ensureFromFirebase({
        uid: 'fb-1',
        email: 'a@example.com',
        emailVerified: true,
      });

      const updated = await service.update(user, { role: UserRole.OWNER } as UpdateMeDto);
      expect(updated.role).toBe(UserRole.OWNER);
    });

    it('rejects changing the role once it is set', async () => {
      const { service } = buildService();
      const user = await service.ensureFromFirebase({
        uid: 'fb-1',
        email: 'a@example.com',
        emailVerified: true,
      });
      await service.update(user, { role: UserRole.OWNER } as UpdateMeDto);

      await expect(
        service.update(user, { role: UserRole.COLLECTOR } as UpdateMeDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows updating the name without touching the role', async () => {
      const { service } = buildService();
      const user = await service.ensureFromFirebase({
        uid: 'fb-1',
        email: 'a@example.com',
        emailVerified: true,
      });
      await service.update(user, { role: UserRole.OWNER } as UpdateMeDto);
      const updated = await service.update(user, { name: 'Alice' } as UpdateMeDto);
      expect(updated.name).toBe('Alice');
      expect(updated.role).toBe(UserRole.OWNER);
    });
  });
});
