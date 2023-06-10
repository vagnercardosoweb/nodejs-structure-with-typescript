import { Utils } from '@/shared';
import { HttpStatusCode } from '@/shared/enums';
import { AppError } from '@/shared/errors';

export class Container implements ContainerInterface {
  public items = new Map<string, any>();
  public resolved = new Map<string, any>();

  public get<T>(id: string): T {
    if (this.resolved.has(id)) {
      return this.resolved.get(id);
    }

    if (!this.items.has(id)) {
      throw new AppError({
        code: 'CONTAINER:NOT_EXIST',
        message: 'Container value [{{id}}] has not been defined',
        sendToSlack: true,
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        metadata: { id },
      });
    }

    const item = this.items.get(id);
    const resolved = typeof item === 'function' ? item.call(this) : item;

    this.resolved.set(id, resolved);
    return resolved;
  }

  public has(id: string): boolean {
    if (this.resolved.get(id)) return true;
    const item = this.items.get(id);
    if (typeof item !== 'function' && !Utils.isUndefined(item)) {
      return true;
    }
    return false;
  }

  public set(id: string, value: ContainerValue): void {
    this.items.set(id, value);
  }
}

export type ContainerValue =
  | ((container: ContainerInterface) => void)
  | string
  | number
  | object
  | [];

export interface ContainerInterface {
  get<T>(id: string): T;

  set(id: string, value: ContainerValue): void;

  has(id: string): boolean;
}
