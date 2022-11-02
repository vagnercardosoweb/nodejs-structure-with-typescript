import { DataTypes } from 'sequelize';
import { Column, Table } from 'sequelize-typescript';

import { TestDto } from '@/database/dtos';
import { BaseModel } from '@/database/models/base';

@Table({ tableName: 'test', paranoid: false })
export class TestModel extends BaseModel<TestDto.Result, TestDto.Create> {
  @Column({ type: DataTypes.STRING })
  public name: TestDto.Result['name'];
}
