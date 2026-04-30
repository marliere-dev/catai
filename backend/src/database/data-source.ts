import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required to run TypeORM CLI');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'typeorm_migrations',
});
