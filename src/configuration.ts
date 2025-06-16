export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    kafkaBroker: process.env.KAFKA_BROKER,
    redisHost: process.env.REDIS_HOST,
    aiGrpcUrl: process.env.AI_GRPC_URL,
    s3Bucket: process.env.S3_BUCKET,
  });
  