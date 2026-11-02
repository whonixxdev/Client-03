"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.olahAvatar = olahAvatar;
const common_1 = require("@nestjs/common");
const modulSharp = require("sharp");
function ambilFabrik() {
    const modul = modulSharp;
    const kandidat = [modul.default, modul.sharp, modulSharp];
    const fabrik = kandidat.find((item) => typeof item === 'function');
    if (!fabrik) {
        throw new Error('Pustaka sharp tidak dapat dimuat.');
    }
    return fabrik;
}
async function olahAvatar(buffer) {
    const fabrik = ambilFabrik();
    try {
        return await fabrik(buffer, { limitInputPixels: 25000000 })
            .rotate()
            .resize(512, 512, { fit: 'cover' })
            .jpeg({ quality: 82 })
            .toBuffer();
    }
    catch {
        throw new common_1.BadRequestException('Foto tidak dapat diproses. Gunakan foto JPG atau PNG yang valid.');
    }
}
//# sourceMappingURL=avatar.util.js.map