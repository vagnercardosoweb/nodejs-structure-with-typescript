export type ContainerValue = ((container: ContainerInterface) => void) | any;

export interface ContainerInterface {
  get<T = any>(id: string): T;
  set(id: string, value: ContainerValue): void;
  clone(): ContainerInterface;
  has(id: string): boolean;
}
