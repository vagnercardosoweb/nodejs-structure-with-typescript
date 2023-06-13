import { QueryResultRow } from 'pg';

import { InternalServerError, NotFoundError, Utils } from '@/shared';

import { PgPoolInterface } from './types';

export class Repository<TRow extends QueryResultRow = any> {
  protected readonly tableName: string = 'table';
  protected readonly primaryKey: string = 'id';

  public constructor(protected readonly pool: PgPoolInterface) {}

  public async findAll<TResult extends QueryResultRow = TRow>(
    params?: FindParams,
  ): Promise<TResult[]> {
    const {
      columns = [`${this.tableName}.*`],
      where = [],
      binding = [],
      orderBy = [],
      joins = [],
      limit = 10,
      offset = -1,
      groupBy = [],
    } = params || {};
    let query = `SELECT ${columns.join(', ')}
                 FROM ${this.getTableName()} `;
    if (joins.length > 0) query += `${joins.join(' ')} `;
    if (where.length > 0) {
      query += `WHERE ${this.makeWhere(where)} `;
    }
    if (groupBy.length > 0) query += `GROUP BY ${groupBy.join(', ')} `;
    if (orderBy.length > 0) query += `ORDER BY ${orderBy.join(', ')} `;
    if (limit !== -1) {
      query += `LIMIT ${limit} `;
      if (offset !== -1) query += `OFFSET ${offset}`;
    }
    const result = await this.pool.query(
      Utils.removeLinesAndSpaceFromSql(query),
      binding,
    );
    return result.rows;
  }

  public async findAndCountAll(
    params?: FindParams,
  ): Promise<{ count: number; rows: TRow[] }> {
    const [countResult] = await this.findAll({
      where: params?.where,
      columns: ['COUNT(1) AS count'],
      groupBy: params?.groupBy,
      binding: params?.binding,
      joins: params?.joins,
    });
    const rows = await this.findAll(params);
    const count = Number(countResult?.count ?? '0');
    return { count, rows };
  }

  public async findOne<TResult = TRow>(
    params: FindOneWithRejectParams,
  ): Promise<TResult>;

  public async findOne<TResult = TRow>(
    params: FindOneParams,
  ): Promise<TResult | null>;

  public async findOne(params: FindOneParams) {
    const result = await this.findAll({ ...params, limit: 1 });
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

  public async findById<T = TRow>(id: string, columns = ['*']) {
    if (!this.primaryKey.trim()) {
      throw new InternalServerError({
        code: 'BASE_REPOSITORY:EMPTY_PRIMARY_KEY',
        message: 'Repository [{{constructorName}}] no primary key defined',
        metadata: { constructorName: this.constructor.name },
      });
    }
    return this.findOne<T>({
      columns,
      where: [`${this.primaryKey} = $1`],
      binding: [id],
    });
  }

  public async create(data: Omit<TRow, 'id'>): Promise<TRow> {
    const record = Utils.removeUndefined(data);
    const columns = Object.keys(record);
    const bindings = columns.map((_, index) => `$${index + 1}`);
    const { rows } = await this.pool.query<TRow>(
      `INSERT INTO ${this.getTableName()} (${columns})
       VALUES (${bindings})
       RETURNING *;`,
      Object.values(record),
    );
    return rows[0];
  }

  public async update({
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

    const { rows } = await this.pool.query<TRow>(
      `UPDATE ${this.getTableName()}
       SET ${set}
       WHERE ${parseWhere}
       RETURNING *;`,
      bindings,
    );

    return rows[0];
  }

  public async delete({ where, binding }: DeleteParams): Promise<TRow> {
    const tableName = this.getTableName();
    const { rows } = await this.pool.query<TRow>(
      `DELETE
       FROM ${tableName}
       WHERE ${this.makeWhere(where)}
       RETURNING *;`,
      binding,
    );
    return rows[0];
  }

  protected getTableName() {
    if (!this.tableName?.trim()) throw new Error('Table name is required');
    return this.tableName;
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

type Where = string[];
type Binding = any[];
type FindParams = {
  where?: Where;
  binding?: Binding;
  columns?: string[];
  orderBy?: string[];
  joins?: string[];
  limit?: number;
  offset?: number;
  groupBy?: string[];
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

type FindOneParams = Omit<FindParams, 'limit' | 'offset'>;
type FindOneWithRejectParams = {
  rejectOnEmpty: boolean | string | Error;
} & FindOneParams;
