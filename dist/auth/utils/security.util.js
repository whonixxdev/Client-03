"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
exports.safeEqual = safeEqual;
exports.normalizeEmail = normalizeEmail;
exports.normalizeUsername = normalizeUsername;
exports.normalizePanitiaId = normalizePanitiaId;
exports.isUniqueViolation = isUniqueViolation;
const crypto_1 = require("crypto");
function generateOtp() {
    return (0, crypto_1.randomInt)(100000, 1000000).toString();
}
function hashOtp(otp, secret) {
    return (0, crypto_1.createHmac)('sha256', secret).update(otp).digest('hex');
}
function safeEqual(a, b) {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) {
        return false;
    }
    return (0, crypto_1.timingSafeEqual)(bufferA, bufferB);
}
function normalizeEmail(value) {
    return value.trim().toLowerCase();
}
function normalizeUsername(value) {
    return value.trim();
}
function normalizePanitiaId(value) {
    return value.trim().toUpperCase();
}
function isUniqueViolation(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002');
}
//# sourceMappingURL=security.util.js.map