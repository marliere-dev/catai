import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async check(): Promise<{ status: 'ok'; db: 'ok' | 'down' }> {
    const db = await this.health.checkDatabase();
    return { status: 'ok', db };
  }
}
