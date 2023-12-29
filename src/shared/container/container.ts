import { ContainerInterface, ContainerValue } from '@/shared/container';
import { InternalServerError } from '@/shared/errors';

export class Container implements ContainerInterface {
  public items = new Map<string, any>();
  public resolved = new Map<string, any>();

  public get<T>(name: string): T {
    if (this.resolved.has(name)) {
      return this.resolved.get(name);
    }

    if (!this.items.has(name)) {
      throw new InternalServerError({
        message: `Container value "${name}" has not been defined`,
        code: 'CONTAINER:NOT_EXIST',
      });
    }

    const item = this.items.get(name);
    const resolved = typeof item === 'function' ? item.call(this) : item;

    this.resolved.set(name, resolved);
    this.items.delete(name);

    return resolved;
  }

  public clone(): Container {
    const container = new Container();
    container.items = new Map(this.items);
    container.resolved = new Map(this.resolved);
    return container;
  }

  public has(name: string): boolean {
    if (this.resolved.has(name)) return true;
    if (this.items.has(name)) return true;
    return false;
  }

  public set(name: string, value: ContainerValue): void {
    this.items.set(name, value);
    if (this.resolved.has(name)) this.resolved.delete(name);
  }
}
