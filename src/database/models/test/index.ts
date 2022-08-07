import { DataTypes } from 'sequelize';
import { Column, Table } from 'sequelize-typescript';

import { BaseModel } from '../base';
import { Test } from './types';

@Table({ tableName: 'test', paranoid: false })
export class TestModel extends BaseModel<Test.Attribute, Test.Dto> {
  @Column({ type: DataTypes.STRING })
  public name: Test.Attribute['name'];
}
