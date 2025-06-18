// src/configuration.ts

export default () => ({
  // 서버
  port: parseInt(process.env.PORT ?? '3000', 10),
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',

  // 로거
  loggerLevels: (process.env.LOGGER_LEVELS ?? 'error,warn,log').split(',') as (
    | 'log'
    | 'error'
    | 'warn'
    | 'debug'
    | 'verbose'
  )[],

  // morgan
  morganFormat: process.env.MORGAN_FORMAT ?? 'dev',

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : true,
    methods:
      process.env.CORS_METHODS ?? 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    allowedHeaders:
      process.env.CORS_ALLOWED_HEADERS ?? 'Content-Type, Accept, Authorization',
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS ?? '',
    maxAge: parseInt(process.env.CORS_MAX_AGE ?? '600', 10),
  },

  // Swagger
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    path:
      process.env.SWAGGER_PATH ?? `${process.env.GLOBAL_PREFIX ?? 'api'}/docs`,
    title: process.env.SWAGGER_TITLE ?? 'Cheat Guard API',
    description:
      process.env.SWAGGER_DESCRIPTION ??
      '온라인 시험 부정행위 감지 시스템 API 문서',
    version: process.env.SWAGGER_VERSION ?? '1.0',
    bearerName: process.env.SWAGGER_BEARER_NAME ?? 'access-token',
    persistAuthorization: process.env.SWAGGER_PERSIST_AUTH === 'true',
  },

  // Kafka, Redis, AI 서버, 외부 API
  kafkaBroker: process.env.KAFKA_BROKER!,
  redisHost: process.env.REDIS_HOST!,
  aiGrpcUrl: process.env.AI_GRPC_URL!,
  aiServerUrl: process.env.AI_SERVER_URL ?? 'http://localhost:5000',
  fastApiUrl: process.env.FAST_API_URL ?? 'http://localhost:8000',
  s3Bucket: process.env.S3_BUCKET!,

  // 데이터베이스
  db: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },
});
