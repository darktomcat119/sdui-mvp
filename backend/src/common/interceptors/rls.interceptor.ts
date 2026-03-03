import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DataSource } from 'typeorm';

/**
 * RLS Interceptor — sets PostgreSQL session variables for row-level security.
 *
 * Runs AFTER guards (JwtAuthGuard), so req.user is already populated.
 * Sets `app.current_municipality_id` and `app.is_system_admin` on each request.
 * These variables are used by RLS policies on tenant-scoped tables.
 *
 * NOTE: Uses session-level SET via DataSource.query(). In low-concurrency
 * environments (development), this works correctly. For production with
 * high concurrency, use PgBouncer in transaction mode.
 */
@Injectable()
export class RlsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RlsInterceptor.name);

  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user) {
      return next.handle();
    }

    return from(this.setRlsContext(user)).pipe(
      switchMap(() => next.handle()),
    );
  }

  private async setRlsContext(user: any): Promise<void> {
    try {
      if (user.municipalityId) {
        await this.dataSource.query(
          `SELECT set_config('app.current_municipality_id', $1, false)`,
          [user.municipalityId],
        );
        await this.dataSource.query(
          `SELECT set_config('app.is_system_admin', 'false', false)`,
        );
      } else {
        // System admin — bypass RLS via policy
        await this.dataSource.query(
          `SELECT set_config('app.current_municipality_id', '', false)`,
        );
        await this.dataSource.query(
          `SELECT set_config('app.is_system_admin', 'true', false)`,
        );
      }
    } catch (err) {
      this.logger.warn('Failed to set RLS context', err);
    }
  }
}
