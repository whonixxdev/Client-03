"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFile = detectFile;
exports.slugify = slugify;
exports.validateFile = validateFile;
const common_1 = require("@nestjs/common");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
function detectFile(buffer) {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { ext: 'jpg', mime: 'image/jpeg' };
    }
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
        return { ext: 'png', mime: 'image/png' };
    }
    if (buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-') {
        return { ext: 'pdf', mime: 'application/pdf' };
    }
    return null;
}
function slugify(value) {
    const slug = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40)
        .replace(/-+$/g, '');
    return slug || 'siswa';
}
function validateFile(file, maxBytes, allowed) {
    if (!file || !file.buffer || file.size === 0) {
        throw new common_1.BadRequestException('File wajib diunggah.');
    }
    if (file.size > maxBytes) {
        throw new common_1.BadRequestException(`Ukuran file maksimal ${Math.round(maxBytes / (1024 * 1024))} MB.`);
    }
    const terdeteksi = detectFile(file.buffer);
    if (!terdeteksi || !allowed.includes(terdeteksi.ext)) {
        throw new common_1.BadRequestException(`Format file tidak didukung. Gunakan ${allowed.join(', ').toUpperCase()}.`);
    }
    return { buffer: file.buffer, ext: terdeteksi.ext, mime: terdeteksi.mime };
}
//# sourceMappingURL=file.util.js.map