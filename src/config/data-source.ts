import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || 'development'}`) });

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mariadb',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: parseInt(configService.get<string>('DB_PORT', '3306'), 10),
  username: configService.get<string>('DB_USERNAME', 'root'),
  password: configService.get<string>('DB_PASSWORD', 'password'),
  database: configService.get<string>('DB_DATABASE', 'cheatguard_dev'),
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/../database/migrations/*.{js,ts}'],
  synchronize: false,
  logging: configService.get<string>('NODE_ENV') === 'development',
  migrationsRun: false,
  migrationsTableName: 'migrations',
  extra: {
    charset: 'utf8mb4_general_ci',
    connectionLimit: configService.get<number>('DB_CONNECTION_LIMIT', 10),
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
