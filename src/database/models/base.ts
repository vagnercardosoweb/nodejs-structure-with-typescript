import { FindOptions } from 'sequelize';
import { Model, ModelStatic } from 'sequelize-typescript';

import { NotFoundError } from '@/errors';

export class BaseModel<
  TModelAttributes extends Record<string, any> = any,
  TCreationAttributes extends Record<string, any> = TModelAttributes,
> extends Model<TModelAttributes, TCreationAttributes> {
  public created_at?: Date;
  public updated_at?: Date | null;
  public deleted_at?: Date | null;

  public static findOrFail<M extends Model = Model>(
    this: ModelStatic<M>,
    options: FindOptions<M['_attributes']> & { message: string },
  ): Promise<M>;
  public static async findOrFail<M extends Model = Model>(
    options: FindOptions<M['_attributes']> & { message: string },
  ): Promise<Model> {
    const result = await this.findOne({
      ...options,
      rejectOnEmpty: new NotFoundError({
        message: options.message,
        code: 'model:not-found',
      }),
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
