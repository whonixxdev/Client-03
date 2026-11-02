import { ConfigService } from '@nestjs/config';
export type JenisBucket = 'berkas' | 'avatar';
export declare class StorageService {
    private readonly logger;
    private readonly client;
    private readonly buckets;
    constructor(config: ConfigService);
    upload(key: string, body: Buffer, contentType: string, bucket?: JenisBucket): Promise<void>;
    remove(key: string, bucket?: JenisBucket): Promise<void>;
    createSignedUrl(key: string, expiresInSeconds?: number, bucket?: JenisBucket): Promise<string>;
}
