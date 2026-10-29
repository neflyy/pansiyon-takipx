import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { sql } from "./db";

const key = () => new TextEncoder().encode(process.env.JWT_SECRET);

export function hashPw(pw, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(pw, salt, 64).toString("hex") };
}
export function checkPw(pw, salt, hash) {
  const a = Buffer.from(scryptSync(pw, salt, 64).toString("hex"));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const tempPw = () => randomBytes(4).toString("hex") + "A1";

export async function setSession(id) {
  const t = await new SignJWT({ id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("12h").sign(key());
  cookies().set("s", t, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 43200 });
}
export async function getUser() {
  try {
    const t = cookies().get("s")?.value;
    if (!t) return null;
    const { payload } = await jwtVerify(t, key());
    const [u] = await sql`select id, role, username, full_name, tc, scope, must_change from users where id = ${payload.id}`;
    return u || null;
  } catch { return null; }
}

export async function setParent(phone) {
  const t = await new SignJWT({ ph: phone }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30m").sign(key());
  cookies().set("p", t, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 1800 });
}
export async function getParent() {
  try {
    const t = cookies().get("p")?.value;
    if (!t) return null;
    const { payload } = await jwtVerify(t, key());
    return payload.ph || null;
  } catch { return null; }
}
