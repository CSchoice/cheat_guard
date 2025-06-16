export default () => ({
  // 환경변수 PORT가 없으면 '3000'을 기본으로 사용
  port: parseInt(process.env.PORT ?? '3000', 10),

  kafkaBroker: process.env.KAFKA_BROKER!,
  redisHost: process.env.REDIS_HOST!,
  aiGrpcUrl: process.env.AI_GRPC_URL!,
  s3Bucket: process.env.S3_BUCKET!,

  db: {
    host: process.env.DB_HOST!,
    // 환경변수 DB_PORT가 없으면 '3306'을 기본으로 사용
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
  },
});
