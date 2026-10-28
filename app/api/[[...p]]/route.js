import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db.js';
import { hashPw, checkPw, okPw, tmpPw, sign, me } from '../../../lib/auth.js';
export const dynamic = 'force-dynamic';
const J = (d, s = 200) => NextResponse.json(d, { status: s, headers: { 'Cache-Control': 'no-store, max-age=0' } });
const roomOk = (r) => Number.isInteger(r) && r >= 101 && r <= 315 && r % 100 >= 1 && r % 100 <= 15 && r % 100 !== 7;
const clean = (v, n) => String(v ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().slice(0, n);
const digits = (v) => String(v ?? '').replace(/\D/g, '');
const log = (u, a) => sql`insert into audit_log(user_id,action) values(${u?.id ?? null},${a})`;
const CODE_TTL = 5; // onay kodu geçerlilik süresi (dakika)
const normSinif = (v) => String(v ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLocaleUpperCase('tr').replace(/[\s\-./]/g, '').slice(0, 10);
const hm = (t, c) => crypto.createHmac('sha256', process.env.JWT_SECRET || '').update(t + ':' + c).digest('hex');
const eqHex = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const reqState = (r) => { if (!r) return 'bekliyor'; const now = Date.now(); if (r.status === 'kod_gonderildi') return new Date(r.code_expires_at) < now ? 'suresi_doldu' : 'kod_gonderildi'; if (r.status === 'bekliyor') return now - new Date(r.created_at) > 36e5 ? 'suresi_doldu' : 'bekliyor'; return r.status; };
async function limit(key, max, mins) {
  const r = await sql`insert into rate_limits(key,n,t) values(${key},1,now()) on conflict (key) do update set n=case when rate_limits.t < now() - make_interval(mins => ${mins}::int) then 1 else rate_limits.n+1 end, t=case when rate_limits.t < now() - make_interval(mins => ${mins}::int) then now() else rate_limits.t end returning n`;
  return r[0].n <= max;
}
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
  if (p.startsWith('public/')) {
    const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
    if (p === 'public/status' && m === 'GET') {
      const t = clean(req.nextUrl.searchParams.get('ticket'), 40);
      if (!/^[a-f0-9]{32}$/.test(t) || !(await limit('st:' + ip, 120, 10))) return J({ status: 'bekliyor' });
      return J({ status: reqState((await sql`select status,code_expires_at,created_at from leave_requests where ticket=${t}`)[0]) });
    }
    if (p === 'public/request' && m === 'POST') {
      if (!(await limit('rq:' + ip, 5, 10))) return bad('Çok fazla talep. 10 dakika sonra tekrar deneyin', 429);
      const sinif = normSinif(b.sinif), no = digits(b.okul_no).slice(0, 8), a = new Date(b.starts), z = new Date(b.ends);
      if (!sinif || !no || isNaN(a) || isNaN(z) || z <= a || z - a > 30 * 864e5) return bad('Sınıf, okul numarası ve geçerli tarihleri girin', 400);
      const ticket = crypto.randomBytes(16).toString('hex'); // öğrenci bulunamasa da aynı yanıt verilir (bilgi sızdırmamak için)
      const st = (await sql`select id from students where sinif=${sinif} and okul_no=${no}`)[0];
      if (st && (await limit('stu:' + st.id, 3, 30))) {
        await sql`insert into leave_requests(ticket,student_id,kind,starts_at,ends_at,reason,transport,address) values(${ticket},${st.id},${clean(b.kind, 30)},${b.starts}::timestamp at time zone 'Europe/Istanbul',${b.ends}::timestamp at time zone 'Europe/Istanbul',${clean(b.reason, 200)},${clean(b.transport, 40)},${clean(b.address, 200)})`;
        await log(null, 'Veli izin talebi oluşturdu (öğrenci #' + st.id + ')');
      }
      return J({ ticket });
    }
    if (p === 'public/verify' && m === 'POST') {
      if (!(await limit('vf:' + ip, 15, 10))) return bad('Çok fazla deneme. 10 dakika sonra tekrar deneyin', 429);
      const t = clean(b.ticket, 40), code = digits(b.code).slice(0, 6);
      const r = /^[a-f0-9]{32}$/.test(t) && code.length === 6 ? (await sql`select * from leave_requests where ticket=${t}`)[0] : null;
      if (!r || reqState(r) !== 'kod_gonderildi') return bad('Kod geçersiz veya süresi dolmuş', 400);
      if (!eqHex(hm(t, code), r.code_hash)) {
        await sql`update leave_requests set attempts=attempts+1, status=case when attempts+1>=5 then 'reddedildi' else status end where id=${r.id}`;
        return bad('Kod hatalı', 400);
      }
      const ok = await sql`update leave_requests set status='onaylandi' where id=${r.id} and status='kod_gonderildi' returning student_id`;
      if (!ok.length) return bad('Kod geçersiz veya süresi dolmuş', 400);
      await sql`insert into leaves(student_id,kind,starts_at,ends_at,reason,transport,address,created_by) select student_id,kind,starts_at,ends_at,reason,transport,address,null from leave_requests where id=${r.id}`;
      await sql`update students set status='izinli' where id=${r.student_id}`;
      await log(null, 'Veli onay koduyla izni onayladı (öğrenci #' + r.student_id + ')');
      return J({ status: 'onaylandi' });
    }
    return bad('Bulunamadı', 404);
  }
  if (!u) return bad('Oturum gerekli', 401);

  if (p === 'password' && m === 'POST') {
    if (!okPw(b.password)) return bad('Şifre en az 8 karakter, harf ve rakam içermeli', 400);
    const { salt, hash } = hashPw(b.password);
    await sql`update users set salt=${salt},hash=${hash},must_change=false where id=${u.id}`; await log(u, 'Şifre değiştirildi'); return J({ ok: 1 });
  }
  if (u.must_change) return bad('Önce şifrenizi değiştirin');

  if (p === 'data') {
    const veli = u.role === 'veli', o = {};
    o.students = veli ? await sql`select id,full_name,room,bed,status,phone,sinif,okul_no from students where parent_tc=${u.tc} order by id`
      : await sql`select id,full_name,room,bed,status,phone,sinif,okul_no from students order by room,bed`;
    o.att = veli ? await sql`select a.student_id,a.day::text as day,a.session,a.state from attendance a join students s on s.id=a.student_id where s.parent_tc=${u.tc} order by a.day desc limit 60`
      : await sql`select student_id,session,state from attendance where day=${today()}::date`;
    if (u.role === 'yon') {
      o.users = await sql`select id,role,username,full_name,tc from users order by id`;
      o.audit = await sql`select a.id,a.action,a.created_at,u.full_name from audit_log a left join users u on u.id=a.user_id order by a.id desc limit 50`;
    }
    return J(o);
  }

  if (p === 'leave') return bad('İzin talebi yalnızca /izin sayfasından, WhatsApp onay koduyla yapılır', 403);
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

  if (p === 'requests' && m === 'GET' && can('bel', 'yon')) {
    return J({ items: await sql`select r.id,r.kind,r.starts_at,r.ends_at,r.reason,r.transport,r.status,r.code_expires_at,s.full_name,s.room,s.sinif,s.okul_no from leave_requests r join students s on s.id=r.student_id where r.status in ('bekliyor','kod_gonderildi') and r.created_at > now() - interval '60 minutes' order by r.id` });
  }
  if (p === 'requests/approve' && can('bel', 'yon')) {
    const r = (await sql`select r.id,r.ticket,r.kind,r.starts_at,r.ends_at,s.full_name,s.phone from leave_requests r join students s on s.id=r.student_id where r.id=${+b.id} and r.status in ('bekliyor','kod_gonderildi') and r.created_at > now() - interval '60 minutes'`)[0];
    if (!r) return bad('Talep bulunamadı veya süresi doldu', 404);
    if (!r.phone) return bad('Velinin telefon numarası kayıtlı değil', 400);
    const code = String(crypto.randomInt(100000, 1000000));
    await sql`update leave_requests set status='kod_gonderildi',code_hash=${hm(r.ticket, code)},code_expires_at=now() + make_interval(mins => ${CODE_TTL}::int),attempts=0,decided_by=${u.id} where id=${r.id}`;
    await log(u, 'İzin onay kodu üretildi: ' + r.full_name);
    return J({ code, phone: r.phone, name: r.full_name, ttl: CODE_TTL, kind: r.kind, starts_at: r.starts_at, ends_at: r.ends_at });
  }
  if (p === 'requests/reject' && can('bel', 'yon')) {
    await sql`update leave_requests set status='reddedildi',decided_by=${u.id} where id=${+b.id} and status in ('bekliyor','kod_gonderildi')`;
    await log(u, 'İzin talebi reddedildi #' + +b.id); return J({ ok: 1 });
  }

  if (!can('yon')) return bad();

  if (p === 'students/bulk') {
    const temps = []; let n = 0;
    for (const x of Array.isArray(b.rows) ? b.rows.slice(0, 500) : []) {
      const name = clean(x[0], 60), oda = +x[1], yat = +x[2] || 1, tc = digits(x[3]), tel = digits(x[4]), sinif = normSinif(x[5]), no = digits(x[6]).slice(0, 8);
      if (!name || !roomOk(oda) || yat < 1 || yat > 4 || tc.length !== 11 || (tel && !/^0?\d{10}$/.test(tel)) || !sinif || !no) continue;
      const ins = await sql`insert into students(full_name,room,bed,parent_tc,phone,sinif,okul_no) values(${name},${oda},${yat},${tc},${tel},${sinif},${no}) on conflict do nothing returning id`;
      if (!ins.length) continue;
      if (!(await sql`select 1 from users where tc=${tc}`).length) { const t = tmpPw(), { salt, hash } = hashPw(t); await sql`insert into users(role,full_name,tc,phone,salt,hash) values('veli',${name + ' Velisi'},${tc},${tel},${salt},${hash})`; temps.push({ tc, pw: t }); }
      n++;
    }
    await log(u, n + ' öğrenci aktarıldı'); return J({ added: n, temps });
  }
  if (p === 'students/update') {
    const r = +b.room, bed = +b.bed, status = ['yurtta', 'revir'].includes(b.status) ? b.status : null, sinif = b.sinif ? normSinif(b.sinif) : null, no = b.okul_no ? digits(b.okul_no).slice(0, 8) : null;
    if (!roomOk(r) || bed < 1 || bed > 4) return bad('Geçersiz oda/yatak (107, 207, 307 kullanılamaz)', 400);
    try { await sql`update students set room=${r},bed=${bed},status=coalesce(${status},status),sinif=coalesce(${sinif},sinif),okul_no=coalesce(${no},okul_no) where id=${+b.id}`; } catch { return bad('Bu sınıf/okul numarası başka bir öğrencide kayıtlı', 400); }
    await log(u, 'Öğrenci güncellendi #' + +b.id); return J({ ok: 1 });
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
