import { QueryResultRow } from 'pg';

import { Common } from '@/shared/common';
import { InternalServerError, NotFoundError } from '@/shared/errors';

import { PgPoolInterface } from './types';

export class BaseRepository<TRow extends QueryResultRow> {
  protected readonly tableName: string = 'table';
  protected readonly primaryKey: string = 'id';

  protected readonly deletedAt: string | null = 'deleted_at';
  protected readonly updatedAt: string | null = 'updated_at';
  protected readonly createdAt: string | null = 'created_at';

  public constructor(protected readonly pgPool: PgPoolInterface) {}

  protected async findAll<T = TRow>(params?: FindParams<T>): Promise<T[]> {
    const {
      where = [],
      joins = [],
      limit = -1,
      offset = -1,
      columns = [`"${this.tableName}".*`],
      tableAlias,
      binding = [],
      orderBy = [],
      groupBy = [],
    } = params || {};
    let query = `SELECT ${columns.join(', ')} `;
    query += `FROM ${this.tableName} `;
    if (tableAlias) query += `AS ${tableAlias.trim()} `;
    if (joins.length > 0) query += `${joins.join(' ')} `;
    if (where.length > 0) query += `WHERE ${this.makeWhere(where)} `;
    if (groupBy.length > 0) query += `GROUP BY ${groupBy.join(', ')} `;
    if (orderBy.length > 0) query += `ORDER BY ${orderBy.join(', ')} `;
    if (limit !== -1) {
      query += `LIMIT ${limit} `;
      if (offset !== -1) query += `OFFSET ${offset}`;
    }
    const result = await this.pgPool.query(query.trim(), binding);
    return result.rows;
  }

  protected async findAndCountAll<T extends QueryResultRow = TRow>(
    params?: FindParams<T>,
  ): Promise<{ total: number; rows: T[] }> {
    const [{ total }] = await this.findAll<{ total: number }>({
      limit: -1,
      where: params?.where,
      columns: ['COUNT(1)::INTEGER AS total'],
      groupBy: params?.groupBy,
      tableAlias: params?.tableAlias,
      binding: params?.binding,
      joins: params?.joins,
    });
    const rows = await this.findAll<T>(params);
    return { total, rows };
  }

  protected async findOne<T = TRow>(
    params: FindOneWithRejectParams<T>,
  ): Promise<T>;

  protected async findOne<T = TRow>(
    params: FindOneParams<T>,
  ): Promise<T | null>;

  protected async findOne<T = TRow>(params: FindOneParams<T>) {
    const result = await this.findAll<T>({ ...params, limit: 1 });
    if (
      result.length === 0 &&
      Object.prototype.hasOwnProperty.call(params, 'rejectOnEmpty')
    ) {
      const rejectOnEmpty = (<any>params).rejectOnEmpty;
      if (typeof rejectOnEmpty === 'object') throw rejectOnEmpty;
      throw NotFoundError.fromMessage(rejectOnEmpty ?? 'Resource not found');
    }
    return result.at(0) ?? null;
  }

  protected async findById<T = TRow>(params: FindByIdParams<T>) {
    if (!params.where) params.where = [];
    if (!params.binding) params.binding = [];
    const bindingLength = params.binding.length;
    if (params.where.length > 0) {
      const totalWhereBinding = params.where.reduce((total, current) => {
        if (current.match(/\$\d+/)) total += 1;
        return total;
      }, 0);
      if (totalWhereBinding !== bindingLength) {
        if (params.rejectOnEmpty) params.rejectOnEmpty = undefined as any;
        throw new InternalServerError({
          code: 'DATABASE:REPOSITORY:DIFERENCE_BINDING',
          message:
            `The query bind is incorrect, needs to have "${totalWhereBinding}"` +
            ` values and received "${bindingLength}".`,
          metadata: { params },
        });
      }
    }
    params.where.push(`${this.primaryKey} = $${bindingLength + 1}`);
    params.binding.push(params.id);
    return this.findOne<T>(params);
  }

  protected async create(data: Omit<TRow, 'id'>): Promise<TRow> {
    data = Common.removeUndefined(data);
    if (this.createdAt && !data.hasOwnProperty(this.createdAt)) {
      (data as any)[this.createdAt] = 'NOW()';
    }
    const columns = Object.keys(data);
    const bindings = columns.map((_, index) => `$${index + 1}`);
    const { rows } = await this.pgPool.query<TRow>(
      `INSERT INTO ${this.tableName} (${columns})
       VALUES (${bindings})
       RETURNING *;`,
      Object.values(data),
    );
    return rows[0];
  }

  protected async update<T extends QueryResultRow = TRow>({
    data,
    where,
    binding,
  }: UpdateParams<T>): Promise<T> {
    data = Common.removeUndefined(data);

    if (this.updatedAt && !data.hasOwnProperty(this.updatedAt)) {
      (data as any)[this.updatedAt] = 'NOW()';
    }

    const columns = Object.keys(data);

    const set = columns
      .map((column, index) => `${column} = $${index + 1}`)
      .join(', ');

    const length = columns.length;
    const bindings = Object.values(data);

    binding.forEach((bind, index) => {
      bindings[index + length] = bind;
    });

    const parseWhere = this.makeWhere(where, length);
    const { rows } = await this.pgPool.query<T>(
      `UPDATE ${this.tableName} SET ${set} WHERE ${parseWhere} RETURNING *;`,
      bindings,
    );

    return rows[0];
  }

  protected async delete({ where, binding }: DeleteParams): Promise<TRow> {
    if (this.deletedAt) {
      return this.update<any>({
        where,
        data: { [this.deletedAt]: 'NOW()' },
        binding,
      });
    }
    const tableName = this.tableName;
    const { rows } = await this.pgPool.query<TRow>(
      `DELETE FROM ${tableName} WHERE ${this.makeWhere(where)} RETURNING *;`,
      binding,
    );
    return rows[0];
  }

  private makeWhere(where: string[], initialIndex = 0): string {
    const filterWhere = where.filter(Boolean);
    if (!filterWhere.length) throw new Error('Where clause is required');
    return filterWhere
      .map((text) => text.trim())
      .join(' AND ')
      .trim()
      .replace(/\$(\d)/gi, (_, index) => {
        return `$${Number(index) + initialIndex}`;
      });
  }
}

type Binding = any[];
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type Where = string[];

type FindParams<Column> = {
  where?: Where;
  binding?: Binding;
  columns?: (keyof Column)[] | string[];
  orderBy?: string[];
  joins?: string[];
  groupBy?: string[];
  tableAlias?: string;
  offset?: number;
  limit?: number;
};

type DeleteParams = {
  where: Where;
  binding: Binding;
};

type UpdateParams<T extends QueryResultRow> = {
  where: Where;
  binding: Binding;
  data: Partial<T>;
};

type FindOneParams<Column> = Omit<FindParams<Column>, 'limit' | 'offset'>;

type FindOneWithRejectParams<Column> = {
  rejectOnEmpty: string | Error;
} & FindOneParams<Column>;

type FindByIdParams<Column> = { id: any } & Omit<
  FindOneWithRejectParams<Column>,
  'groupBy' | 'orderBy'
>;
