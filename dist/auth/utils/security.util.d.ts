export declare function generateOtp(): string;
export declare function hashOtp(otp: string, secret: string): string;
export declare function safeEqual(a: string, b: string): boolean;
export declare function normalizeEmail(value: string): string;
export declare function normalizeUsername(value: string): string;
export declare function normalizePanitiaId(value: string): string;
export declare function isUniqueViolation(error: unknown): boolean;
