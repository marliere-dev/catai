import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('reports ok when the database responds', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: getDataSourceToken(), useValue: dataSource }],
    }).compile();

    const controller = moduleRef.get(HealthController);
    await expect(controller.check()).resolves.toEqual({ status: 'ok', db: 'ok' });
  });

  it('reports db: down when the database query throws', async () => {
    const dataSource = { query: jest.fn().mockRejectedValue(new Error('connection refused')) };
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: getDataSourceToken(), useValue: dataSource }],
    }).compile();

    const controller = moduleRef.get(HealthController);
    await expect(controller.check()).resolves.toEqual({ status: 'ok', db: 'down' });
  });
});
