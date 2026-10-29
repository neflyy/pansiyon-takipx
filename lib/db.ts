import { Pool, PoolConfig } from 'pg';

declare global {
  var pgPool: Pool | undefined;
}

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const pool = globalThis.pgPool || new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  globalThis.pgPool = pool;
}

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (error) {
    console.error('[DB Query Error]:', { text, error });
    throw error;
  }
}
