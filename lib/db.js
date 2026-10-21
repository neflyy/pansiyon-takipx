import { neon } from '@neondatabase/serverless';
let q;
export const sql = (...a) => {
  if (!q) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil (Vercel > Settings > Environment Variables)');
    q = neon(process.env.DATABASE_URL);
  }
  return q(...a);
};
