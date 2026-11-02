export interface FileTerdeteksi {
    ext: 'jpg' | 'png' | 'pdf';
    mime: 'image/jpeg' | 'image/png' | 'application/pdf';
}
export interface BerkasTervalidasi extends FileTerdeteksi {
    buffer: Buffer;
}
export declare function detectFile(buffer: Buffer): FileTerdeteksi | null;
export declare function slugify(value: string): string;
export declare function validateFile(file: Express.Multer.File | undefined, maxBytes: number, allowed: readonly string[]): BerkasTervalidasi;
