import { DataTypes, literal, ModelAttributes, QueryInterface } from 'sequelize';

interface Params {
  mergeColumns: ModelAttributes;
  softDelete?: boolean;
}

const createdAtName = process.env.DB_CREATED_AT_NAME || 'created_at';
const updatedAtName = process.env.DB_UPDATED_AT_NAME || 'updated_at';
const deletedAtName = process.env.DB_DELETED_AT_NAME || 'deleted_at';

export const makeColumnUuid = () => ({
  type: DataTypes.UUID,
  unique: true,
  allowNull: false,
  primaryKey: true,
  defaultValue: literal('uuid_generate_v4()'),
});

export const addDefaultColumns = ({
  softDelete = true,
  mergeColumns,
}: Params) => ({
  id: makeColumnUuid(),
  ...mergeColumns,
  [updatedAtName]: {
    type: DataTypes.DATE,
    defaultValue: literal('NOW()'),
    allowNull: false,
  },
  [createdAtName]: {
    type: DataTypes.DATE,
    defaultValue: literal('NOW()'),
    allowNull: false,
  },
  ...(softDelete
    ? {
        [deletedAtName]: {
          type: DataTypes.DATE,
          defaultValue: null,
          allowNull: true,
        },
      }
    : {}),
});

export const addDefaultIndexes = async ({
  tableName,
  queryInterface,
  softDelete = true,
}: {
  tableName: string;
  queryInterface: QueryInterface;
  softDelete?: boolean;
}) => {
  await queryInterface.addIndex(tableName, ['id']);
  await queryInterface.addIndex(tableName, [createdAtName]);
  await queryInterface.addIndex(tableName, [updatedAtName]);

  if (softDelete) {
    await queryInterface.addIndex(tableName, [deletedAtName]);
  }
};
