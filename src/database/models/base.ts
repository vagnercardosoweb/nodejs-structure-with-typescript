import { FindOptions } from 'sequelize';
import { Model, ModelStatic } from 'sequelize-typescript';

import { NotFoundError } from '@/errors';
import { Util } from '@/shared';

export class BaseModel<
  TModelAttributes extends Record<string, any> = any,
  TCreationAttributes extends Record<string, any> = TModelAttributes,
> extends Model<TModelAttributes, TCreationAttributes> {
  public created_at?: Date;
  public updated_at?: Date | null;
  public deleted_at?: Date | null;

  public static findOrFail<M extends Model = Model>(
    this: ModelStatic<M>,
    options: FindOptions<M['_attributes']> & {
      rejectOnEmpty: string | Error;
    },
  ): Promise<M>;

  public static async findOrFail<M extends Model = Model>(
    options: FindOptions<M['_attributes']> & {
      rejectOnEmpty: string | Error;
    },
  ): Promise<Model> {
    const rejectOnEmpty = (
      Util.isString(options.rejectOnEmpty)
        ? new NotFoundError({
            message: options.rejectOnEmpty as string,
            code: 'model:not-found',
          })
        : options.rejectOnEmpty
    ) as Error;
    const result = await this.findOne({
      ...options,
      rejectOnEmpty,
    });
    return result;
  }

  public setDataValues(values: Partial<TCreationAttributes>): void {
    Object.entries<any>(values).forEach(([column, value]: [any, any]) => {
      if (value?.toString() !== 'undefined') {
        this.setDataValue(column, value);
      }
    });
  }
}
