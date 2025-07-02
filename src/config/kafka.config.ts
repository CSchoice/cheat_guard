import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => ({
  clientId: 'cheatguard-server',
  brokers: process.env.KAFKA_BROKER ? 
    process.env.KAFKA_BROKER.split(',') : 
    ['localhost:9092'],
  groupId: process.env.KAFKA_GROUP_ID || 'cheatguard-group',
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_USERNAME ? {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  } : null,
  connectionTimeout: 3000,
  authenticationTimeout: 1000,
  requestTimeout: 5000,
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
}));
