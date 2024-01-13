import { InternalServerError, NotFoundError } from '@/shared/errors';
import { PgPoolInterface, QueryResultRow } from '@/shared/postgres';
import { removeUndefined } from '@/shared/utils';

export class BaseRepository<
  Input extends QueryResultRow = NonNullable<unknown>,
  Output extends Input = Input,
> {
  protected readonly tableName: string = 'table';
  protected readonly primaryKey: string | null = 'id';

  protected readonly deletedAt: string | null = 'deleted_at';
  protected readonly updatedAt: string | null = 'updated_at';
  protected readonly createdAt: string | null = 'created_at';

  public constructor(protected readonly pgPool: PgPoolInterface) {}

  public async create(input: CreateInput<Input>): Promise<undefined>;

  public async create<O extends QueryResultRow = Output>(
    input: CreateInputWithReturning<Input, O>,
  ): Promise<{
    // @ts-ignore - This is a hack to make the return type works
    [K in keyof O]: Output[K];
  }>;

  public async create<O extends QueryResultRow = Output>(
    input: CreateInputWithReturning<Input, O>,
  ): Promise<
    | {
        // @ts-ignore - This is a hack to make the return type works
        [K in keyof O]: Output[K];
      }
    | undefined
  > {
    const data = removeUndefined(input.data);
    const returning = input.returning ?? [];

    if (this.createdAt && !data.hasOwnProperty(this.createdAt)) {
      (data as any)[this.createdAt] = 'NOW()';
    }

    const columns = Object.keys(data);
    const values = columns.map((_, index) => `$${index + 1}`);

    let query = `INSERT INTO ${this.tableName} (${this.join(
      columns,
    )}) VALUES (${this.join(values)})`;

    if (returning.length) {
      query += ` RETURNING ${this.join(returning as string[])}`;
    }

    const { rows } = await this.pgPool.query(`${query};`, Object.values(data));
    return rows[0];
  }

  public async update(input: UpdateInput<Input>): Promise<undefined>;

  public async update<O extends QueryResultRow = Output>(
    input: UpdateInputWithReturning<Input, O>,
  ): Promise<{
    // @ts-ignore - This is a hack to make the return type works
    [K in keyof O]: Output[K];
  }>;

  public async update<I = Input, O extends QueryResultRow = Output>({
    data,
    where,
    returning,
    values,
  }: UpdateInputWithReturning<I, O>): Promise<
    | {
        // @ts-ignore - This is a hack to make the return type works
        [K in keyof O]: Output[K];
      }
    | undefined
  > {
    data = removeUndefined(data);

    if (this.updatedAt && !data.hasOwnProperty(this.updatedAt)) {
      (data as any)[this.updatedAt] = 'NOW()';
    }

    const set = this.join(
      Object.keys(data).map((column, index) => `${column} = $${index + 1}`),
    );

    const valuesFromData = Object.values(data);
    const valuesFromDataSize = valuesFromData.length;

    values.forEach((value, index) => {
      valuesFromData[index + valuesFromDataSize] = value;
    });

    const parseWhere = this.makeWhere(where, valuesFromDataSize);
    let query = `UPDATE ${this.tableName} SET ${set} WHERE ${parseWhere}`;

    if (returning?.length) {
      query += ` RETURNING ${this.join(returning as string[])}`;
    }

    const { rows } = await this.pgPool.query(query, valuesFromData);
    return rows[0];
  }

  public async delete(input: DeleteInput): Promise<undefined>;

  public async delete<O extends QueryResultRow = Output>(
    input: DeleteInputWithReturning<O>,
  ): Promise<{
    // @ts-ignore - This is a hack to make the return type works
    [K in keyof O]: Output[K];
  }>;

  public async delete<O extends QueryResultRow = Output>({
    where,
    returning,
    values,
  }: DeleteInputWithReturning<O>): Promise<
    | {
        // @ts-ignore - This is a hack to make the return type works
        [K in keyof O]: Output[K];
      }
    | undefined
  > {
    if (this.deletedAt) {
      return this.update({
        where,
        data: { [this.deletedAt]: 'NOW()' } as any,
        returning,
        values,
      });
    }

    const whereAsString = this.makeWhere(where);
    let query = `DELETE FROM ${this.tableName} WHERE ${whereAsString}`;

    if (returning?.length) {
      query += ` RETURNING ${this.join(returning as string[])}`;
    }

    const { rows } = await this.pgPool.query(query, values);
    return rows[0];
  }

  public async findAll<O extends QueryResultRow = Output>(
    params?: FindParams<O>,
  ): Promise<O[]> {
    const {
      where = [],
      joins = [],
      limit = 50,
      offset = -1,
      columns = [],
      tableAlias,
      values = [],
      orderBy = [],
      groupBy = [],
    } = params || {};

    const columnsWithTable = (columns as string[]).map((column) => {
      if (column.indexOf('*') !== -1) {
        throw new InternalServerError({
          message: `The column "${column}" is not allowed`,
          metadata: { repositoryName: this.constructor.name, params },
        });
      }
      if (column.match(/\sas\s/gi)) return column;
      if (column.indexOf('.') !== -1) return column;
      if (tableAlias) return `${tableAlias}.${column}`;
      return column;
    });

    if (columnsWithTable.length === 0) {
      columnsWithTable.push(`${this.tableName}.*`);
    }

    let query = `SELECT ${this.join(columnsWithTable)} `;
    query += `FROM ${this.tableName} `;

    if (tableAlias) query += `AS ${tableAlias.trim()} `;
    if (joins.length > 0) query += `${joins.join(' ')} `;
    if (where.length > 0) query += `WHERE ${this.makeWhere(where)} `;
    if (groupBy.length > 0) query += `GROUP BY ${this.join(groupBy)} `;
    if (orderBy.length > 0) query += `ORDER BY ${this.join(orderBy)} `;

    if (limit !== -1) {
      query += `LIMIT ${limit} `;
      if (offset !== -1) query += `OFFSET ${offset}`;
    }

    const result = await this.pgPool.query<O>(query, values);
    return result.rows;
  }

  public async findAndCountAll<O extends QueryResultRow = Output>(
    params?: FindParams<O>,
  ): Promise<{ total: number; rows: O[] }> {
    const [result] = await this.findAll<{ total: number }>({
      limit: -1,
      where: params?.where,
      columns: ['COUNT(1)::INTEGER AS total'],
      groupBy: params?.groupBy,
      tableAlias: params?.tableAlias,
      values: params?.values,
      joins: params?.joins,
    });

    const rows = await this.findAll<O>(params);
    return { rows, total: result.total };
  }

  public async findOne<O extends QueryResultRow = Output>(
    params: FindOneWithRejectParams<O>,
  ): Promise<O>;

  public async findOne<O extends QueryResultRow = Output>(
    params: FindOneParams<O>,
  ): Promise<O | null>;

  public async findOne<O extends QueryResultRow = Output>(
    params: FindOneParams<O>,
  ) {
    const result = await this.findAll<O>({ ...params, limit: 1 });

    if (
      result.length === 0 &&
      Object.prototype.hasOwnProperty.call(params, 'rejectOnEmpty')
    ) {
      const { rejectOnEmpty } = params as FindOneWithRejectParams<O>;
      if (typeof rejectOnEmpty === 'object') throw rejectOnEmpty;
      throw new NotFoundError({ message: rejectOnEmpty });
    }

    return result.at(0) ?? null;
  }

  public async findById<O extends QueryResultRow = Output>(
    params: FindByIdParams<O>,
  ) {
    if (this.primaryKey === null || !this.primaryKey.trim()) {
      throw new InternalServerError({
        message: `The primary key for model "${this.constructor.name}" is not set.`,
      });
    }

    params.where = params.where ?? [];
    params.values = params.values ?? [];
    const bindingLength = params.values.length;

    if (params.where.length > 0) {
      const totalWhereBinding = params.where.reduce((total, current) => {
        if (current.match(/\$\d+/)) total += 1;
        return total;
      }, 0);

      if (totalWhereBinding !== bindingLength) {
        if (params.rejectOnEmpty) params.rejectOnEmpty = undefined as any;
        throw new InternalServerError({
          code: 'BASE_REPOSITORY:DIFFERENCE_BINDING',
          message:
            `The query bind is incorrect, needs to have "${totalWhereBinding}"` +
            ` values and received "${bindingLength}".`,
          metadata: params,
        });
      }
    }

    params.where.push(`${this.primaryKey} = $${bindingLength + 1}`);
    params.values.push(params.id);

    return this.findOne<O>(params);
  }

  protected join(value: string[]) {
    return value.filter(Boolean).join(', ');
  }

  protected makeWhere(where: string[], initialIndex = 0): string {
    const filterWhere = where.filter(Boolean);
    if (!filterWhere.length) {
      throw new InternalServerError({
        message: `The where clause is empty for model "${this.constructor.name}".`,
      });
    }
    return filterWhere
      .map((text) => text.trim())
      .join(' AND ')
      .trim()
      .replace(/\$(\d)/gi, (_, index) => {
        return `$${Number(index) + initialIndex}`;
      });
  }
}

type Values = any[];
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type Where = string[];

type FindParams<O> = {
  where?: Where;
  values?: Values;
  columns?: (keyof O)[] | string[];
  orderBy?: string[];
  joins?: string[];
  groupBy?: string[];
  tableAlias?: string;
  offset?: number;
  limit?: number;
};

type ReturningKeys<T> = (keyof T)[];

export type DeleteInput = {
  values: Values;
  where: Where;
};

export type DeleteInputWithReturning<O> = DeleteInput & {
  returning: ReturningKeys<O>;
};

export type CreateInput<I> = {
  data: I;
};

export type CreateInputWithReturning<I, O> = CreateInput<I> & {
  returning: ReturningKeys<O>;
};

export type UpdateInput<I> = {
  where: Where;
  values: Values;
  data: Partial<I>;
};

export type UpdateInputWithReturning<I, O> = UpdateInput<I> & {
  returning: ReturningKeys<O>;
};

type FindOneParams<C> = Omit<FindParams<C>, 'limit' | 'offset'>;

type FindOneWithRejectParams<C> = {
  rejectOnEmpty: string | Error;
} & FindOneParams<C>;

type FindByIdParams<C> = { id: any } & Omit<
  FindOneWithRejectParams<C>,
  'groupBy' | 'orderBy'
>;
