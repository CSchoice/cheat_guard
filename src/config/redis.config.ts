import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
  keyPrefix: process.env.REDIS_PREFIX || 'cheatguard:',
  ttl: process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL, 10) : 3600,
}));
