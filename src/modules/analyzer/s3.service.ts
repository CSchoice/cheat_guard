import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    const accessKeyId = this.config.get<string>('s3.accessKeyId');
    const secretAccessKey = this.config.get<string>('s3.secretAccessKey');
    const region = this.config.get<string>('s3.region');
    const bucket = this.config.get<string>('s3.bucket');

    if (!accessKeyId || !secretAccessKey || !region || !bucket) {
      throw new Error(
        'S3 설정 누락: accessKeyId, secretAccessKey, region, bucket 중 하나 이상 없음',
      );
    }

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucket = bucket;
    this.region = region;
  }

  async getPresignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    // 전체 URL이 들어온 경우 Key만 추출
    if (key.startsWith(`https://${this.bucket}.s3.${this.region}.amazonaws.com/`)) {
      key = key.replace(`https://${this.bucket}.s3.${this.region}.amazonaws.com/`, '');
    }
  
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
  
    const url = await getSignedUrl(this.s3, command, {
      expiresIn: expiresInSeconds,
    });
  
    return url;
  }

  async uploadBase64Image(
    base64Data: string,
    folder: string = 'cheating',
  ): Promise<string> {
    const buffer = Buffer.from(base64Data, 'base64');
    const key = `${folder}/${uuid()}.jpg`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    };

    await this.s3.send(new PutObjectCommand(params));

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
