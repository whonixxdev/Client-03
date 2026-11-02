"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let StorageService = StorageService_1 = class StorageService {
    logger = new common_1.Logger(StorageService_1.name);
    client;
    buckets;
    constructor(config) {
        const bucketBerkas = config.getOrThrow('AWS_BUCKET');
        this.buckets = {
            berkas: bucketBerkas,
            avatar: config.get('AWS_BUCKET_AVATAR') || bucketBerkas,
        };
        this.client = new client_s3_1.S3Client({
            region: config.getOrThrow('AWS_DEFAULT_REGION'),
            endpoint: config.getOrThrow('AWS_ENDPOINT'),
            forcePathStyle: true,
            credentials: {
                accessKeyId: config.getOrThrow('AWS_ACCESS_KEY_ID'),
                secretAccessKey: config.getOrThrow('AWS_SECRET_ACCESS_KEY'),
            },
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        });
    }
    async upload(key, body, contentType, bucket = 'berkas') {
        try {
            await this.client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.buckets[bucket],
                Key: key,
                Body: body,
                ContentType: contentType,
            }));
        }
        catch (error) {
            this.logger.error(`Gagal mengunggah berkas ${key}`, error instanceof Error ? error.stack : undefined);
            throw new common_1.InternalServerErrorException('Gagal menyimpan berkas. Silakan coba lagi.');
        }
    }
    async remove(key, bucket = 'berkas') {
        try {
            await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
        }
        catch (error) {
            this.logger.warn(`Gagal menghapus berkas ${key}`, error instanceof Error ? error.stack : undefined);
        }
    }
    async createSignedUrl(key, expiresInSeconds = 300, bucket = 'berkas') {
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, new client_s3_1.GetObjectCommand({ Bucket: this.buckets[bucket], Key: key }), { expiresIn: expiresInSeconds });
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map