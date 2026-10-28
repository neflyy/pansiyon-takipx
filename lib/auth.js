import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { sql } from './db.js';
const key = () => new TextEncoder().encode(process.env.JWT_SECRET);
const dk = (p, salt) => crypto.pbkdf2Sync(p, salt, 150000, 32, 'sha256');
export const hashPw = (p) => { const salt = crypto.randomBytes(16).toString('base64'); return { salt, hash: dk(p, salt).toString('base64') }; };
export const checkPw = (p, salt, hash) => { const h = dk(p, salt), b = Buffer.from(hash, 'base64'); return b.length === h.length && crypto.timingSafeEqual(h, b); };
export const okPw = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 100 && /[A-Za-z]/.test(p) && /\d/.test(p);
export const tmpPw = () => { const a = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; return Array.from(crypto.randomBytes(10), (x) => a[x % a.length]).join('') + '7'; };
export const sign = (u) => new SignJWT({ id: u.id }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('8h').sign(key());
export async function me(req) {
  const t = req.cookies.get('s')?.value; if (!t) return null;
  try { const { payload } = await jwtVerify(t, key()); const r = await sql`select id,role,full_name,tc,must_change from users where id=${payload.id}`; return r[0] || null; } catch { return null; }
}
