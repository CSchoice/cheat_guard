import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  globalPrefix: process.env.GLOBAL_PREFIX || 'api',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  cors: {
    origins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : 
      ['http://localhost:3000', 'http://localhost:3001'],
    methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS || 'Content-Type, Accept, Authorization',
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS || '',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '600', 10),
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    path: process.env.SWAGGER_PATH || 'api/docs',
    title: process.env.SWAGGER_TITLE || 'Cheat Guard API',
    description: process.env.SWAGGER_DESCRIPTION || 'Online Exam Proctoring System API',
    version: process.env.SWAGGER_VERSION || '1.0',
    bearerName: process.env.SWAGGER_BEARER_NAME || 'access-token',
    persistAuthorization: process.env.SWAGGER_PERSIST_AUTH === 'true',
  },
}));
