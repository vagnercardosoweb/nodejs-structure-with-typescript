import { Timestamp } from '@/database/types';

export namespace Test {
  export interface Dto {
    name: string;
  }

  export interface Attribute extends Dto, Timestamp {
    id: string;

    [key: string]: any;
  }
}
