import { QueryResultRow } from 'pg';

import { InternalServerError, NotFoundError, Utils } from '@/shared';

import { PgPoolInterface } from './types';

export class Repository<TRow extends QueryResultRow = any> {
  protected readonly tableName: string = 'table';
  protected readonly primaryKey: string = 'id';

  public constructor(protected readonly pgPool: PgPoolInterface) {}

  protected async getMany<T = TRow>(params?: FindParams<T>): Promise<T[]> {
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
    if (tableAlias?.trim()) query += `AS ${tableAlias} `;
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

  protected async getManyAndCount<T extends QueryResultRow = TRow>(
    params?: FindParams<T>,
  ): Promise<{ count: number; rows: T[] }> {
    const [countResult] = await this.getMany<T>({
      where: params?.where,
      tableAlias: params?.tableAlias,
      columns: ['COUNT(1) AS count'],
      groupBy: params?.groupBy,
      binding: params?.binding,
      joins: params?.joins,
    });
    const rows = await this.getMany<T>(params);
    const count = Number(countResult?.count ?? '0');
    return { count, rows };
  }

  protected async getFirst<T = TRow>(
    params: FindOneWithRejectParams<T>,
  ): Promise<T>;

  protected async getFirst<T = TRow>(
    params: FindOneParams<T>,
  ): Promise<T | null>;

  protected async getFirst<T = TRow>(params: FindOneParams<T>) {
    const result = await this.getMany<T>({ ...params, limit: 1 });
    if (
      result.length === 0 &&
      Object.prototype.hasOwnProperty.call(params, 'rejectOnEmpty')
    ) {
      const rejectOnEmpty = (<any>params).rejectOnEmpty;
      if (typeof rejectOnEmpty === 'object') throw rejectOnEmpty;
      let message = 'No results found';
      if (typeof rejectOnEmpty === 'string') message = rejectOnEmpty;
      throw new NotFoundError({ message });
    }
    return result.at(0) ?? null;
  }

  protected async getById<T = TRow>(params: FindByIdParams<T>) {
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
          code: 'BASE_REPOSITORY:DIFERENCE_BINDING',
          message:
            'The query bind is incorrect, needs to have {{totalWhereBinding}}' +
            ' values and received {{bindingLength}}.',
          metadata: {
            totalWhereBinding,
            bindingLength,
            params,
          },
        });
      }
    }
    params.where.push(`${this.primaryKey} = $${bindingLength + 1}`);
    params.binding.push(params.id);
    return this.getFirst<T>(params);
  }

  protected async create(data: Omit<TRow, 'id'>): Promise<TRow> {
    const record = Utils.removeUndefined(data);
    const columns = Object.keys(record);
    const bindings = columns.map((_, index) => `$${index + 1}`);
    const { rows } = await this.pgPool.query<TRow>(
      `INSERT INTO ${this.tableName} (${columns})
       VALUES (${bindings})
       RETURNING *;`,
      Object.values(record),
    );
    return rows[0];
  }

  protected async update({
    data,
    where,
    binding,
  }: UpdateParams<TRow>): Promise<TRow> {
    const record = Utils.removeUndefined(data);
    const columns = Object.keys(record);
    const length = columns.length;

    const set = columns
      .map((column, index) => `${column} = $${index + 1}`)
      .join(', ');

    const bindings = [...Object.values(record)];
    const parseWhere = this.makeWhere(where, length);

    binding.forEach((bind, index) => {
      bindings[index + length] = bind;
    });

    const { rows } = await this.pgPool.query<TRow>(
      `UPDATE ${this.tableName}
       SET ${set}
       WHERE ${parseWhere}
       RETURNING *;`,
      bindings,
    );

    return rows[0];
  }

  protected async delete({ where, binding }: DeleteParams): Promise<TRow> {
    const tableName = this.tableName;
    const { rows } = await this.pgPool.query<TRow>(
      `DELETE
       FROM ${tableName}
       WHERE ${this.makeWhere(where)}
       RETURNING *;`,
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

type UpdateParams<Data extends QueryResultRow = any> = {
  where: Where;
  binding: Binding;
  data: Partial<Data>;
};

type FindOneParams<Column> = Omit<FindParams<Column>, 'limit' | 'offset'>;

type FindOneWithRejectParams<Column> = {
  rejectOnEmpty: boolean | string | Error;
} & FindOneParams<Column>;

type FindByIdParams<Column> = { id: any } & Omit<
  FindOneWithRejectParams<Column>,
  'groupBy' | 'orderBy'
>;
