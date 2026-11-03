import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type JenisBucket = 'berkas' | 'avatar' | 'berita';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly buckets: Record<JenisBucket, string>;
  private readonly supabaseUrl: string | undefined;

  constructor(config: ConfigService) {
    const bucketBerkas = config.getOrThrow<string>('AWS_BUCKET');
    this.buckets = {
      berkas: bucketBerkas,
      avatar: config.get<string>('AWS_BUCKET_AVATAR') || bucketBerkas,
      berita: config.get<string>('AWS_BUCKET_BERITA') || 'berita',
    };
    this.supabaseUrl = config.get<string>('SUPABASE_URL');
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

  async getBuffer(key: string, bucket: JenisBucket = 'berkas'): Promise<Buffer> {
    const hasil = await this.client.send(
      new GetObjectCommand({ Bucket: this.buckets[bucket], Key: key }),
    );
    const bytes = await hasil.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error('Isi berkas kosong.');
    }
    return Buffer.from(bytes);
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

  publicUrl(key: string, bucket: JenisBucket = 'berita'): string | null {
    if (!this.supabaseUrl) {
      return null;
    }
    const dasar = this.supabaseUrl.replace(/\/+$/, '');
    return `${dasar}/storage/v1/object/public/${this.buckets[bucket]}/${key}`;
  }
}
