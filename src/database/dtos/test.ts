import { Timestamp } from '@/database/types';

export namespace TestDto {
  export interface Create {
    name: string;
  }

  export interface Result extends Create, Timestamp {
    id: string;

    [key: string]: any;
  }
}
