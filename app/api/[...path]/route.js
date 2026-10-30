import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomInt, createHash } from "crypto";
import { sql } from "@/lib/db";
import { hashPw, checkPw, tempPw, setSession, getUser, setParent, getParent } from "@/lib/auth";

const J = (d, s = 200) => NextResponse.json(d, { status: s });
const strong = (p) => typeof p === "string" && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
const today = () => new Date().toLocaleDateString("sv", { timeZone: "Europe/Istanbul" });
const roomOk = (n) => n >= 101 && n <= 315 && ![107, 207, 307].includes(n);
const log = (uid, action) => sql`insert into audit_log(user_id, action) values (${uid}, ${action})`;
const phone10 = (s) => { const t = String(s || "").replace(/\D/g, "").slice(-10); return t.length === 10 && t[0] === "5" ? t : null; };
const hashCode = (c) => createHash("sha256").update(c + process.env.JWT_SECRET).digest("hex");
const gender = (g) => { const c = String(g || "").trim().charAt(0).toUpperCase(); return c === "K" ? "K" : c === "E" ? "E" : null; };

const pickDay = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : today());
const atTime = (ses) => (ses === "yat" ? "22:00" : "19:30");
const slug = (t) => t.toLowerCase().replace(/\u0307/g, "").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

async function insertStudent(o) {
  const m = o.mp ? phone10(o.mp) : null, f = o.fp ? phone10(o.fp) : null, g = gender(o.g);
  if (o.mp && !m) return "Anne telefonu geçersiz";
  if (o.fp && !f) return "Baba telefonu geçersiz";
  if (!o.name || !g) return "Ad soyad ve pansiyon (kız/erkek) gerekli";
  const room = +o.room;
  if (!roomOk(room)) return "Oda 101–315 arasında olmalı (107, 207, 307 yok)";
  let bed = +o.bed;
  if (!(bed >= 1 && bed <= 4)) { const [c] = await sql`select count(*)::int as n from students where room = ${room}`; bed = Math.min(4, c.n + 1); }
  await sql`insert into students(full_name, room, bed, gender, mother_name, mother_phone, father_name, father_phone) values (${o.name.trim()}, ${room}, ${bed}, ${g}, ${o.mn || null}, ${m}, ${o.fn || null}, ${f})`;
  return null;
}

async function sendWa(to10, name, code) {
  const body = `Sayın Velimiz (${name}),\nVeli Portalı Giriş Şifreniz: *${code}*\nGüvenliğiniz için bu kodu kimseyle paylaşmayınız.`;
  await sql`insert into wa_outbox(phone, body) values (${to10}, ${body})`;
}

async function handle(req, { params }) {
  const p = params.path.join("/");
  const post = req.method === "POST";
  const b = post ? await req.json().catch(() => ({})) : {};
  const u = await getUser();
  const sc = u?.scope || null;
  const need = (...roles) => (!u ? J({ error: "Giriş yapın" }, 401) : roles.length && !roles.includes(u.role) ? J({ error: "Yetkiniz yok" }, 403) : null);
  const canSee = async (id) => { const [s] = await sql`select gender from students where id = ${id}`; return !!s && (!sc || s.gender === sc); };
  let e;

  try {
    if (p === "me") {
      const [c] = await sql`select count(*)::int as n from users`;
      return J({ user: u, setup: c.n === 0 });
    }

    if (p === "setup" && post) {
      const [c] = await sql`select count(*)::int as n from users`;
      if (c.n > 0) return J({ error: "Kurulum zaten yapıldı" }, 403);
      if (!b.full_name || !b.username) return J({ error: "Ad ve kullanıcı adı gerekli" }, 400);
      if (!strong(b.password)) return J({ error: "Şifre en az 8 karakter, harf ve rakam içermeli" }, 400);
      const { salt, hash } = hashPw(b.password);
      const [x] = await sql`insert into users(role, username, full_name, salt, hash, must_change) values ('yon', ${b.username.trim().toLowerCase()}, ${b.full_name.trim()}, ${salt}, ${hash}, false) returning id`;
      await setSession(x.id);
      return J({ ok: true });
    }

    if (p === "login" && post) {
      const id = String(b.ident || "").trim().toLowerCase();
      const [a] = await sql`select * from login_attempts where ident = ${id}`;
      if (a?.locked_until && new Date(a.locked_until) > new Date()) return J({ error: "Çok fazla deneme. 5 dakika bekleyin." }, 429);
      const [x] = await sql`select * from users where lower(username) = ${id} and role <> 'veli'`;
      if (!x || !checkPw(String(b.password || ""), x.salt, x.hash)) {
        await sql`insert into login_attempts(ident, fails) values (${id}, 1)
          on conflict (ident) do update set fails = login_attempts.fails + 1,
          locked_until = case when login_attempts.fails + 1 >= 5 then now() + interval '5 minutes' else null end`;
        return J({ error: "Kullanıcı adı veya şifre hatalı" }, 401);
      }
      await sql`delete from login_attempts where ident = ${id}`;
      await setSession(x.id);
      await log(x.id, "giris");
      return J({ ok: true });
    }

    if (p === "logout" && post) { cookies().delete("s"); return J({ ok: true }); }

    if (p === "password" && post) {
      if ((e = need())) return e;
      if (!strong(b.password)) return J({ error: "Şifre en az 8 karakter, harf ve rakam içermeli" }, 400);
      const { salt, hash } = hashPw(b.password);
      await sql`update users set salt = ${salt}, hash = ${hash}, must_change = false where id = ${u.id}`;
      await log(u.id, "sifre_degisti");
      return J({ ok: true });
    }

    if (p === "students") {
      if ((e = need("bel", "yon"))) return e;
      return J({ students: await sql`select s.*, exists(select 1 from leaves l where l.student_id = s.id and now() between l.starts_at and l.ends_at) as on_leave from students s where (${sc}::text is null or s.gender = ${sc}) order by s.room, s.bed` });
    }

    if (p === "students/status" && post) {
      if ((e = need("bel", "yon"))) return e;
      if (!["yurtta", "izinli", "etutte", "revir"].includes(b.status)) return J({ error: "Geçersiz durum" }, 400);
      if (!(await canSee(b.id))) return J({ error: "Yetkiniz yok" }, 403);
      await sql`update students set status = ${b.status} where id = ${b.id}`;
      await log(u.id, `durum:${b.id}:${b.status}`);
      return J({ ok: true });
    }

    if (p === "students/import" && post) {
      if ((e = need("yon"))) return e;
      let added = 0; const errors = [];
      const lines = String(b.text || "").split("\n").map((l) => l.trim()).filter(Boolean);
      for (const [i, line] of lines.entries()) {
        const x = line.split(/\t|;|\|/).map((t) => t.trim());
        if (/^ad\s*soyad/i.test(x[0])) continue;
        let o;
        if (/^[kKeE]/.test(x[1] || "") && !/^\d/.test(x[1] || "")) {
          const kat = +x[2], oda = +x[3];
          o = { name: x[0], g: x[1], room: oda >= 100 ? oda : kat * 100 + oda, mn: x[4], mp: x[5], fn: x[6], fp: x[7] };
        } else o = { name: x[0], room: x[1], bed: x[2], g: x[3], mn: x[4], mp: x[5], fn: x[6], fp: x[7] };
        const err = await insertStudent(o);
        if (err) errors.push(`Satır ${i + 1}: ${err} → "${line}"`); else added++;
      }
      await log(u.id, `import:${added}`);
      return J({ added, errors });
    }

    if (p === "students/add" && post) {
      if ((e = need("yon"))) return e;
      const err = await insertStudent({ name: b.full_name, g: b.gender, room: b.room, bed: b.bed, mn: b.mother_name, mp: b.mother_phone, fn: b.father_name, fp: b.father_phone });
      if (err) return J({ error: err }, 400);
      await log(u.id, `ogrenci_eklendi:${b.full_name}`);
      return J({ ok: true });
    }

    if (p === "students/delete" && post) {
      if ((e = need("yon"))) return e;
      await sql`delete from students where id = ${b.id}`;
      await log(u.id, `ogrenci_silindi:${b.id}`);
      return J({ ok: true });
    }

    if (p === "students/reset" && post) {
      if ((e = need("yon"))) return e;
      await sql`delete from students`;
      await log(u.id, "ogrenciler_sifirlandi");
      return J({ ok: true });
    }

    if (p === "users") {
      if ((e = need("yon"))) return e;
      if (post) {
        if (!b.full_name || !["K", "E"].includes(b.scope)) return J({ error: "Ad soyad ve görev bloğu gerekli" }, 400);
        const explicit = (b.username || "").trim().toLowerCase();
        let un = explicit || slug(b.full_name);
        if (!un) return J({ error: "Kullanıcı adı üretilemedi" }, 400);
        const [dupe] = await sql`select 1 as x from users where lower(username) = ${un}`;
        if (dupe) { if (explicit) return J({ error: "Bu kullanıcı adı kullanılıyor" }, 409); un += Math.floor(10 + Math.random() * 90); }
        if (b.password && !strong(b.password)) return J({ error: "Şifre en az 8 karakter, harf ve rakam içermeli" }, 400);
        const pw = b.password || tempPw(); const { salt, hash } = hashPw(pw);
        await sql`insert into users(role, scope, username, full_name, branch, phone, salt, hash) values ('bel', ${b.scope}, ${un}, ${b.full_name.trim()}, ${b.branch || null}, ${b.phone || null}, ${salt}, ${hash})`;
        await log(u.id, `belletmen:${un}`);
        return J({ username: un, password: pw });
      }
      return J({ users: await sql`select id, role, scope, username, full_name, branch, phone, must_change from users where role <> 'veli' order by id` });
    }

    if (p === "users/update" && post) {
      if ((e = need("yon"))) return e;
      if (!b.full_name || !["K", "E"].includes(b.scope)) return J({ error: "Ad soyad ve görev bloğu gerekli" }, 400);
      await sql`update users set full_name = ${b.full_name.trim()}, scope = ${b.scope}, branch = ${b.branch || null}, phone = ${b.phone || null} where id = ${b.id} and role = 'bel'`;
      await log(u.id, `belletmen_guncellendi:${b.id}`);
      return J({ ok: true });
    }

    if (p === "users/reset" && post) {
      if ((e = need("yon"))) return e;
      if (b.password && !strong(b.password)) return J({ error: "Şifre en az 8 karakter, harf ve rakam içermeli" }, 400);
      const pw = b.password || tempPw(); const { salt, hash } = hashPw(pw);
      const [x] = await sql`update users set salt = ${salt}, hash = ${hash}, must_change = true where id = ${b.id} and role = 'bel' returning username`;
      if (!x) return J({ error: "Kullanıcı bulunamadı" }, 404);
      await sql`delete from login_attempts where ident = ${String(x.username).toLowerCase()}`;
      await log(u.id, `sifre_sifirlandi:${x.username}`);
      return J({ username: x.username, password: pw });
    }

    if (p === "users/delete" && post) {
      if ((e = need("yon"))) return e;
      await sql`update attendance set taken_by = null where taken_by = ${b.id}`;
      await sql`update leaves set created_by = null where created_by = ${b.id}`;
      await sql`update audit_log set user_id = null where user_id = ${b.id}`;
      await sql`update duty_log set created_by = null where created_by = ${b.id}`;
      await sql`delete from users where id = ${b.id} and role = 'bel'`;
      await log(u.id, `belletmen_silindi:${b.id}`);
      return J({ ok: true });
    }

    if (p === "logs") {
      if ((e = need("yon"))) return e;
      return J({ logs: await sql`select a.id, a.created_at, a.action, u.full_name from audit_log a left join users u on u.id = a.user_id order by a.id desc limit 200` });
    }

    if (p === "duty") {
      if ((e = need("bel", "yon"))) return e;
      if (post) {
        const day = pickDay(b.day), ses = b.session === "yat" ? "yat" : "etut";
        if (b.id) await sql`update duty_log set day = ${day}, session = ${ses}, male_duty = ${b.male_duty || null}, female_duty = ${b.female_duty || null}, notes = ${b.notes || null} where id = ${b.id}`;
        else await sql`insert into duty_log(day, session, male_duty, female_duty, notes, created_by) values (${day}, ${ses}, ${b.male_duty || null}, ${b.female_duty || null}, ${b.notes || null}, ${u.id})`;
        await log(u.id, "nobet_defteri");
        return J({ ok: true });
      }
      return J({ duty: await sql`select id, to_char(day, 'YYYY-MM-DD') as day, session, male_duty, female_duty, notes from duty_log order by duty_log.day desc, id desc limit 100` });
    }

    if (p === "duty/delete" && post) {
      if ((e = need("yon"))) return e;
      await sql`delete from duty_log where id = ${b.id}`;
      await log(u.id, `nobet_silindi:${b.id}`);
      return J({ ok: true });
    }

    if (p === "attendance/notify" && post) {
      if ((e = need("bel", "yon"))) return e;
      const day = pickDay(b.day), ses = b.session === "yat" ? "yat" : "etut";
      if (!["anne", "baba"].includes(b.who)) return J({ error: "Geçersiz" }, 400);
      const [st] = await sql`select s.*, exists(select 1 from leaves l where l.student_id = s.id and ((${day}::date + ${atTime(ses)}::time) at time zone 'Europe/Istanbul') between l.starts_at and l.ends_at) as on_leave from students s where s.id = ${b.student_id}`;
      if (!st || (sc && st.gender !== sc)) return J({ error: "Yetkiniz yok" }, 403);
      if (st.on_leave) return J({ error: "Öğrenci izinli" }, 409);
      const to = b.who === "anne" ? st.mother_phone : st.father_phone;
      const nm = b.who === "anne" ? st.mother_name : st.father_name;
      if (!to) return J({ error: `${b.who === "anne" ? "Anne" : "Baba"} telefonu kayıtlı değil` }, 400);
      const [ex] = await sql`select notified from attendance where student_id = ${st.id} and day = ${day} and session = ${ses}`;
      if (ex?.notified === b.who) return J({ ok: true, note: "Bu seans için zaten gönderilmişti" });
      const dd = day.split("-").reverse().join(".");
      const body = `Sayın Velimiz (${nm || st.full_name + " velisi"}),\n${st.full_name} adlı öğrenciniz ${dd} tarihli ${ses === "yat" ? "yat" : "etüt"} yoklamasında mazeretsiz olarak katılmamıştır. Bilgilerinize sunarız.\nProf. Dr. Necmettin Erbakan Fen Lisesi Pansiyonu`;
      await sql`insert into wa_outbox(phone, body) values (${to}, ${body})`;
      await log(u.id, `bildirim:${st.full_name}:${b.who}`);
      return J({ ok: true });
    }

    if (p === "attendance") {
      if ((e = need("bel", "yon"))) return e;
      if (post) {
        const day = pickDay(b.day), ses = b.session === "yat" ? "yat" : "etut";
        const items = Array.isArray(b.items) ? b.items.slice(0, 400) : [];
        const ids = items.map((i) => +i.student_id).filter(Number.isInteger);
        const okRows = ids.length ? await sql`select s.id from students s where s.id = any(${ids}::int[]) and (${sc}::text is null or s.gender = ${sc}) and not exists (select 1 from leaves l where l.student_id = s.id and ((${day}::date + ${atTime(ses)}::time) at time zone 'Europe/Istanbul') between l.starts_at and l.ends_at)` : [];
        const ok = new Set(okRows.map((r) => r.id));
        const rows = items.filter((i) => ok.has(+i.student_id) && ["var", "yok"].includes(i.state));
        if (rows.length) {
          const sids = rows.map((i) => +i.student_id), sts = rows.map((i) => i.state), nts = rows.map((i) => (["anne", "baba"].includes(i.notified) ? i.notified : null));
          await sql`insert into attendance(student_id, day, session, state, taken_by, notified)
            select x.sid, ${day}::date, ${ses}, x.st, ${u.id}, x.nt from unnest(${sids}::int[], ${sts}::text[], ${nts}::text[]) as x(sid, st, nt)
            on conflict (student_id, day, session) do update set state = excluded.state, taken_by = excluded.taken_by, notified = coalesce(excluded.notified, attendance.notified)`;
        }
        await log(u.id, `yoklama:${day}:${ses}:${rows.length}`);
        return J({ ok: true, saved: rows.length });
      }
      const sp = new URL(req.url).searchParams;
      const ses = sp.get("session") === "yat" ? "yat" : "etut";
      const day = pickDay(sp.get("day"));
      const rows = await sql`select a.student_id, a.state, a.notified from attendance a join students s on s.id = a.student_id where a.day = ${day} and a.session = ${ses} and (${sc}::text is null or s.gender = ${sc})`;
      const lv = await sql`select distinct l.student_id from leaves l join students s on s.id = l.student_id where ((${day}::date + ${atTime(ses)}::time) at time zone 'Europe/Istanbul') between l.starts_at and l.ends_at and (${sc}::text is null or s.gender = ${sc})`;
      return J({ day, rows, onleave: lv.map((x) => x.student_id) });
    }

    if (p === "leaves") {
      if ((e = need("bel", "yon"))) return e;
      if (post) {
        if (!b.student_id || !b.starts_at || !b.ends_at || !b.kind) return J({ error: "Tüm alanları doldurun" }, 400);
        if (!(await canSee(b.student_id))) return J({ error: "Yetkiniz yok" }, 403);
        await sql`insert into leaves(student_id, kind, starts_at, ends_at, reason, created_by) values (${b.student_id}, ${b.kind}, ${b.starts_at}, ${b.ends_at}, ${b.reason || null}, ${u.id})`;
        await log(u.id, `izin:${b.student_id}`);
        return J({ ok: true });
      }
      return J({ leaves: await sql`select l.*, s.full_name, s.room from leaves l join students s on s.id = l.student_id where (${sc}::text is null or s.gender = ${sc}) order by l.starts_at desc limit 50` });
    }

    if (p === "veli/kod" && post) {
      const ph = phone10(b.phone);
      if (!ph) return J({ error: "Geçerli bir cep telefonu yazın (5XX XXX XX XX)" }, 400);
      const [r] = await sql`select count(*)::int as n from parent_codes where phone = ${ph} and created_at > now() - interval '1 hour'`;
      if (r.n >= 5) return J({ error: "Çok fazla istek. Daha sonra tekrar deneyin." }, 429);
      const [k] = await sql`select full_name, mother_name, mother_phone, father_name from students where mother_phone = ${ph} or father_phone = ${ph} limit 1`;
      if (!k) return J({ error: "Bu telefon numarası öğrenci kayıtlarında bulunamadı. Okul idaresiyle iletişime geçin." }, 404);
      {
        const name = (k.mother_phone === ph ? k.mother_name : k.father_name) || `${k.full_name} velisi`;
        const code = String(randomInt(100000, 1000000));
        await sql`insert into parent_codes(phone, code_hash, expires_at) values (${ph}, ${hashCode(code)}, now() + interval '5 minutes')`;
        try { await sendWa(ph, name, code); } catch (err) { console.error(err); return J({ error: "Kod gönderilemedi. Daha sonra tekrar deneyin." }, 502); }
      }
      return J({ ok: true });
    }

    if (p === "veli/dogrula" && post) {
      const ph = phone10(b.phone);
      const [c] = await sql`select * from parent_codes where phone = ${ph} and expires_at > now() order by id desc limit 1`;
      if (!c || c.tries >= 3) return J({ error: "Kod geçersiz veya süresi doldu. Yeni kod isteyin." }, 400);
      if (c.code_hash !== hashCode(String(b.code || "").trim())) {
        await sql`update parent_codes set tries = tries + 1 where id = ${c.id}`;
        return J({ error: "Kod hatalı" }, 401);
      }
      await sql`delete from parent_codes where phone = ${ph}`;
      await setParent(ph);
      await log(null, `veli_giris:${ph.slice(-4)}`);
      return J({ ok: true });
    }

    if (p === "veli/cikis" && post) { cookies().delete("p"); return J({ ok: true }); }

    if (p === "veli/ben") {
      const ph = await getParent();
      if (!ph) return J({ error: "Doğrulama gerekli" }, 401);
      const students = await sql`select id, full_name, room, bed, status from students where mother_phone = ${ph} or father_phone = ${ph} order by full_name`;
      const leaves = await sql`select l.id, l.kind, l.starts_at, l.ends_at, s.full_name from leaves l join students s on s.id = l.student_id where s.mother_phone = ${ph} or s.father_phone = ${ph} order by l.starts_at desc limit 20`;
      const history = await sql`select to_char(a.day, 'YYYY-MM-DD') as day, a.session, a.state, s.full_name from attendance a join students s on s.id = a.student_id where s.mother_phone = ${ph} or s.father_phone = ${ph} order by a.day desc, a.session desc limit 40`;
      return J({ students, leaves, history });
    }

    if (p === "veli/izin" && post) {
      const ph = await getParent();
      if (!ph) return J({ error: "Doğrulama gerekli" }, 401);
      const [s] = await sql`select id from students where id = ${b.student_id} and (mother_phone = ${ph} or father_phone = ${ph})`;
      if (!s) return J({ error: "Bu öğrenci için yetkiniz yok" }, 403);
      if (!b.kind || !b.starts_at || !b.ends_at || new Date(b.ends_at) <= new Date(b.starts_at)) return J({ error: "Çıkış ve dönüş zamanını doğru girin" }, 400);
      await sql`insert into leaves(student_id, kind, starts_at, ends_at, reason, requested_by_phone) values (${s.id}, ${b.kind}, ${b.starts_at}, ${b.ends_at}, ${b.reason || null}, ${ph})`;
      await log(null, `veli_izin:${s.id}`);
      return J({ ok: true });
    }

    return J({ error: "Bulunamadı" }, 404);
  } catch (err) {
    console.error(err);
    return J({ error: String(err.message).includes("duplicate") ? "Bu kayıt zaten var" : "Sunucu hatası" }, 500);
  }
}
export { handle as GET, handle as POST };
