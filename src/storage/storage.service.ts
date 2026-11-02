import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type JenisBucket = 'berkas' | 'avatar';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly buckets: Record<JenisBucket, string>;

  constructor(config: ConfigService) {
    const bucketBerkas = config.getOrThrow<string>('AWS_BUCKET');
    this.buckets = {
      berkas: bucketBerkas,
      avatar: config.get<string>('AWS_BUCKET_AVATAR') || bucketBerkas,
    };
    this.client = new S3Client({
      region: config.getOrThrow<string>('AWS_DEFAULT_REGION'),
      endpoint: config.getOrThrow<string>('AWS_ENDPOINT'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
    bucket: JenisBucket = 'berkas',
  ): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.buckets[bucket],
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Gagal mengunggah berkas ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Gagal menyimpan berkas. Silakan coba lagi.');
    }
  }

  async remove(key: string, bucket: JenisBucket = 'berkas'): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.buckets[bucket], Key: key }),
      );
    } catch (error) {
      this.logger.warn(
        `Gagal menghapus berkas ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async createSignedUrl(
    key: string,
    expiresInSeconds = 300,
    bucket: JenisBucket = 'berkas',
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.buckets[bucket], Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}
