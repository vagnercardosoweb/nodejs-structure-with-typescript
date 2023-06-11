import {
  ContainerInterface,
  ContainerValue,
  InternalServerError,
  Utils,
} from '@/shared';

export class Container implements ContainerInterface {
  public items = new Map<string, any>();
  public resolved = new Map<string, any>();

  public get<T>(id: string): T {
    if (this.resolved.has(id)) {
      return this.resolved.get(id);
    }

    if (!this.items.has(id)) {
      throw new InternalServerError({
        code: 'CONTAINER:NOT_EXIST',
        message: 'Container value [{{id}}] has not been defined',
        sendToSlack: true,
        metadata: { id },
      });
    }

    const item = this.items.get(id);
    const resolved = typeof item === 'function' ? item.call(this) : item;

    this.resolved.set(id, resolved);
    this.items.delete(id);

    return resolved;
  }

  public clone(): ContainerInterface {
    const container = new Container();
    container.items = new Map(this.items);
    container.resolved = new Map(this.resolved);
    return container;
  }

  public has(id: string): boolean {
    if (this.resolved.has(id)) return true;
    const item = this.items.get(id);
    return typeof item !== 'function' && !Utils.isUndefined(item);
  }

  public set(id: string, value: ContainerValue): void {
    this.items.set(id, value);
    if (this.resolved.has(id)) this.resolved.delete(id);
  }
}
