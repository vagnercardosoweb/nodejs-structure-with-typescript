import { Request, Response } from 'express';

import { DbConnectionInterface } from '@/shared/postgres/types';

export class ListUserHandler {
  public constructor(private db: DbConnectionInterface) {}

  public async handle(request: Request, response: Response) {
    this.db = this.db.withLoggerId(request.context.requestId);
    const result = await this.db.query(
      'SELECT * FROM users ORDER BY name ASC LIMIT 10',
    );
    const path = `${request.method.toUpperCase()} ${request.originalUrl}`;
    const timestamp = new Date().toISOString();
    return response.json({
      data: result.rows,
      timestamp,
      ipAddress: request.ip,
      path,
    });
  }
}
