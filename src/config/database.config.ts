import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mariadb' as const,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'cheatguard',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-sync only in non-production
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false, // Never use in production
  extra: {
    charset: 'utf8mb4_general_ci',
    connectionLimit: process.env.NODE_ENV === 'production' ? 10 : 5,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    waitForConnections: true,
    queueLimit: 0,
  },
}));
