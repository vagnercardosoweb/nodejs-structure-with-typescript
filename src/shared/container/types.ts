export type ContainerValue =
  | ((container: ContainerInterface) => void)
  | string
  | number
  | object
  | [];

export interface ContainerInterface {
  get<T>(id: string): T;

  set(id: string, value: ContainerValue): void;

  clone(): ContainerInterface;

  has(id: string): boolean;
}
