import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';

/**
 * RLS Middleware — sets PostgreSQL session variables for row-level security.
 *
 * Sets `app.current_municipality_id` and `app.is_system_admin` on each request.
 * These variables are used by RLS policies on tenant-scoped tables.
 *
 * NOTE: This uses session-level SET via DataSource.query(), which sets the variable
 * on whichever connection is acquired from the pool. In low-concurrency environments
 * (development), this works correctly. For production with high concurrency, use
 * PgBouncer in transaction mode or implement per-request transactions.
 */
@Injectable()
export class RlsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RlsMiddleware.name);

  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (user) {
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

    next();
  }
}
