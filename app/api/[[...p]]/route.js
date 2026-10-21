import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db.js';
import { hashPw, checkPw, okPw, tmpPw, sign, me } from '../../../lib/auth.js';
export const dynamic = 'force-dynamic';
const J = (d, s = 200) => NextResponse.json(d, { status: s });
const roomOk = (r) => Number.isInteger(r) && r >= 101 && r <= 315 && r % 100 >= 1 && r % 100 <= 15 && r % 100 !== 7;
const clean = (v, n) => String(v ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().slice(0, n);
const digits = (v) => String(v ?? '').replace(/\D/g, '');
const log = (u, a) => sql`insert into audit_log(user_id,action) values(${u?.id ?? null},${a})`;
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());

async function handle(req) {
  const p = req.nextUrl.pathname.replace(/^\/api\//, '').replace(/\/$/, ''), m = req.method;
  let b = {}; if (m !== 'GET') { try { b = await req.json(); } catch {} }
  const u = await me(req);
  const can = (...r) => u && !u.must_change && r.includes(u.role);
  const bad = (e = 'Yetkisiz işlem', s = 403) => J({ error: e }, s);

  if (p === 'boot') { const any = await sql`select 1 from users limit 1`; return J({ setup: !any.length, me: u }); }

  if (p === 'setup') {
    if ((await sql`select 1 from users limit 1`).length) return bad();
    const name = clean(b.full_name, 60), un = clean(b.username, 30);
    if (!name || !/^[A-Za-z0-9._-]{3,30}$/.test(un) || !okPw(b.password)) return bad('Geçersiz bilgi (şifre: en az 8, harf+rakam)', 400);
    const { salt, hash } = hashPw(b.password);
    const r = await sql`insert into users(role,username,full_name,salt,hash,must_change) values('yon',${un},${name},${salt},${hash},false) returning id`;
    const res = J({ ok: 1 }); res.cookies.set('s', await sign(r[0]), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 28800 });
    await log(r[0], 'İlk kurulum: yönetici oluşturuldu'); return res;
  }

  if (p === 'login') {
    const id = clean(b.ident, 60).toLocaleLowerCase('tr'), pw = String(b.password ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').slice(0, 100);
    if (!id) return bad('Kullanıcı veya şifre hatalı', 401);
    const L = (await sql`select locked_until from login_attempts where ident=${id}`)[0];
    if (L?.locked_until && new Date(L.locked_until) > new Date()) return bad('Çok fazla deneme. 5 dk sonra tekrar deneyin', 429);
    const us = await sql`select * from users where lower(username)=${id} or tc=${id} or phone=${id}`;
    let ok = null; for (const x of us) if (checkPw(pw, x.salt, x.hash)) { ok = x; break; }
    if (!us.length) hashPw('x');
    if (!ok) {
      await sql`insert into login_attempts(ident,fails) values(${id},1) on conflict (ident) do update set fails=case when login_attempts.fails>=4 then 0 else login_attempts.fails+1 end, locked_until=case when login_attempts.fails>=4 then now()+interval '5 minutes' else null end`;
      await log(null, 'Başarılı olmayan giriş denemesi: ' + id.slice(0, 20)); return bad('Kullanıcı veya şifre hatalı', 401);
    }
    await sql`delete from login_attempts where ident=${id}`;
    const res = J({ ok: 1 }); res.cookies.set('s', await sign(ok), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 28800 });
    await log(ok, 'Giriş yapıldı'); return res;
  }

  if (p === 'logout') { const res = J({ ok: 1 }); res.cookies.set('s', '', { path: '/', maxAge: 0 }); return res; }
  if (!u) return bad('Oturum gerekli', 401);

  if (p === 'password' && m === 'POST') {
    if (!okPw(b.password)) return bad('Şifre en az 8 karakter, harf ve rakam içermeli', 400);
    const { salt, hash } = hashPw(b.password);
    await sql`update users set salt=${salt},hash=${hash},must_change=false where id=${u.id}`; await log(u, 'Şifre değiştirildi'); return J({ ok: 1 });
  }
  if (u.must_change) return bad('Önce şifrenizi değiştirin');

  if (p === 'data') {
    const veli = u.role === 'veli', o = {};
    o.students = veli ? await sql`select id,full_name,room,bed,status,phone from students where parent_tc=${u.tc} order by id`
      : await sql`select id,full_name,room,bed,status,phone from students order by room,bed`;
    o.att = veli ? await sql`select a.student_id,a.day::text as day,a.session,a.state from attendance a join students s on s.id=a.student_id where s.parent_tc=${u.tc} order by a.day desc limit 60`
      : await sql`select student_id,session,state from attendance where day=${today()}::date`;
    if (u.role === 'yon') {
      o.users = await sql`select id,role,username,full_name,tc from users order by id`;
      o.audit = await sql`select a.id,a.action,a.created_at,u.full_name from audit_log a left join users u on u.id=a.user_id order by a.id desc limit 50`;
    }
    return J(o);
  }

  if (p === 'leave' && can('veli')) {
    const sid = +b.student_id, st = (await sql`select id,full_name from students where id=${sid} and parent_tc=${u.tc}`)[0];
    const a = new Date(b.starts), z = new Date(b.ends);
    if (!st || isNaN(a) || isNaN(z) || z <= a) return bad('Geçerli öğrenci ve tarihleri girin', 400);
    await sql`insert into leaves(student_id,kind,starts_at,ends_at,reason,transport,address,created_by) values(${sid},${clean(b.kind, 30)},${b.starts}::timestamp at time zone 'Europe/Istanbul',${b.ends}::timestamp at time zone 'Europe/Istanbul',${clean(b.reason, 200)},${clean(b.transport, 40)},${clean(b.address, 200)},${u.id})`;
    await sql`update students set status='izinli' where id=${sid}`; await log(u, st.full_name + ' için izin onaylandı'); return J({ ok: 1 });
  }
  if (p === 'leave/end' && can('veli')) {
    const r = await sql`update students set status='yurtta' where id=${+b.student_id} and parent_tc=${u.tc} returning full_name`;
    if (!r.length) return bad(); await log(u, r[0].full_name + ' izni sonlandı'); return J({ ok: 1 });
  }

  if (p === 'attendance' && can('bel', 'yon')) {
    const ses = b.session === 'yat' ? 'yat' : 'etut', st = await sql`select id,status from students`, ids = [], states = [];
    for (const s of st) { const v = s.status === 'izinli' ? 'izinli' : b.marks?.[s.id]; if (['var', 'yok', 'gec', 'izinli'].includes(v)) { ids.push(s.id); states.push(v); } }
    if (ids.length) await sql`insert into attendance(student_id,day,session,state,taken_by) select x.s,${today()}::date,${ses},x.t,${u.id} from unnest(${ids}::int[],${states}::text[]) as x(s,t) on conflict (student_id,day,session) do update set state=excluded.state,taken_by=excluded.taken_by`;
    await log(u, (ses === 'etut' ? 'Etüt' : 'Yat') + ' yoklaması alındı'); return J({ ok: 1 });
  }

  if (!can('yon')) return bad();

  if (p === 'students/bulk') {
    const temps = []; let n = 0;
    for (const x of Array.isArray(b.rows) ? b.rows.slice(0, 500) : []) {
      const name = clean(x[0], 60), oda = +x[1], yat = +x[2] || 1, tc = digits(x[3]), tel = digits(x[4]);
      if (!name || !roomOk(oda) || yat < 1 || yat > 4 || tc.length !== 11 || (tel && !/^0?\d{10}$/.test(tel))) continue;
      await sql`insert into students(full_name,room,bed,parent_tc,phone) values(${name},${oda},${yat},${tc},${tel})`;
      if (!(await sql`select 1 from users where tc=${tc}`).length) { const t = tmpPw(), { salt, hash } = hashPw(t); await sql`insert into users(role,full_name,tc,phone,salt,hash) values('veli',${name + ' Velisi'},${tc},${tel},${salt},${hash})`; temps.push({ tc, pw: t }); }
      n++;
    }
    await log(u, n + ' öğrenci aktarıldı'); return J({ added: n, temps });
  }
  if (p === 'students/update') {
    const r = +b.room, bed = +b.bed, status = ['yurtta', 'revir'].includes(b.status) ? b.status : null;
    if (!roomOk(r) || bed < 1 || bed > 4) return bad('Geçersiz oda/yatak (107, 207, 307 kullanılamaz)', 400);
    await sql`update students set room=${r},bed=${bed},status=coalesce(${status},status) where id=${+b.id}`; await log(u, 'Öğrenci güncellendi #' + +b.id); return J({ ok: 1 });
  }
  if (p === 'students/delete') { await sql`delete from students where id=${+b.id}`; await log(u, 'Öğrenci silindi #' + +b.id); return J({ ok: 1 }); }
  if (p === 'users/add') {
    const name = clean(b.full_name, 60), un = clean(b.username, 30);
    if (!name || !/^[A-Za-z0-9._-]{3,30}$/.test(un) || (await sql`select 1 from users where lower(username)=${un.toLowerCase()}`).length) return bad('Geçerli ve benzersiz kullanıcı adı girin', 400);
    const t = tmpPw(), { salt, hash } = hashPw(t); await sql`insert into users(role,username,full_name,salt,hash) values('bel',${un},${name},${salt},${hash})`;
    await log(u, 'Belletmen eklendi: ' + name); return J({ pw: t });
  }
  if (p === 'users/reset') {
    if (+b.id === u.id) return bad('Kendi şifrenizi 🔑 ile değiştirin', 400);
    const t = tmpPw(), { salt, hash } = hashPw(t); const r = await sql`update users set salt=${salt},hash=${hash},must_change=true where id=${+b.id} returning full_name`;
    if (!r.length) return bad('Bulunamadı', 404); await log(u, r[0].full_name + ' şifresi sıfırlandı'); return J({ pw: t });
  }
  return bad('Bulunamadı', 404);
}
export const GET = handle, POST = handle;

