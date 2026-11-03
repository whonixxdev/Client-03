import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AUDIT_KEY } from './audit.decorator';

interface PermintaanAudit {
  method?: string;
  originalUrl?: string;
  url?: string;
  user?: { id?: string };
  params?: Record<string, string>;
  body?: unknown;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const aksi = this.reflector.get<string | undefined>(AUDIT_KEY, context.getHandler());
    if (!aksi) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<PermintaanAudit>();

    return next.handle().pipe(
      tap(() => {
        const aktorId = request.user?.id;
        if (!aktorId) {
          return;
        }
        const isiBody =
          request.body && typeof request.body === 'object' ? Object.keys(request.body) : [];
        void this.audit.catat({
          aktorId,
          aksi,
          targetId: request.params?.id ?? request.params?.userId ?? null,
          detail: JSON.stringify({
            metode: request.method,
            jalur: request.originalUrl ?? request.url,
            kolom: isiBody,
          }),
        });
      }),
    );
  }
}
