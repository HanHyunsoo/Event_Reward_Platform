import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor() {
    this.envConfig = {
      port: process.env.USER_SERVICE_PORT || '3000',
    };
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
