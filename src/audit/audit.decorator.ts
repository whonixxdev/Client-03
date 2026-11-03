import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_aksi';

export const Audit = (aksi: string) => SetMetadata(AUDIT_KEY, aksi);
