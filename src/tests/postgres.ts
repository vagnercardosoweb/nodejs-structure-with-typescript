import { PgPoolInterface } from '@/shared/postgres';

export const truncateTables = async (
  pgPool: PgPoolInterface,
  tableNames: string[],
) => {
  const query = tableNames
    .map((tableName) => `TRUNCATE TABLE ${tableName} CASCADE;`)
    .join('\n');
  await pgPool.query(query);
};
