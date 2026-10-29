"use client";
import { useEffect, useState, useCallback } from "react";

async function api(path, body) {
  const r = await fetch("/api/" + path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Bir hata oluştu");
  return d;
}
const ST = { yurtta: "Yurtta", izinli: "İzinli", etutte: "Etütte", revir: "Revirde" };
const AT = { var: "Var", yok: "Yok", gec: "Geç", izinli: "İzinli" };
const ROLE = { yon: "Yönetici", bel: "Belletmen", veli: "Veli" };

function useAction() {
  const [msg, setMsg] = useState(null);
  const run = async (fn, okText) => { setMsg(null); try { const r = await fn(); if (okText) setMsg({ ok: okText }); return r; } catch (e) { setMsg({ err: e.message }); } };
  const box = msg && <div className={msg.err ? "err" : "ok"} role="alert">{msg.err || msg.ok}</div>;
  return [run, box];
}

function Auth({ setup, onDone }) {
  const [f, setF] = useState({}); const [run, box] = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (e) => { e.preventDefault(); run(async () => { await api(setup ? "setup" : "login", f); onDone(); }); };
  return (
    <div className="gate">
      <header className="hero">
        <img src="/logo.png" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/logo.svg"; }} alt="Okul logosu" width="88" height="88" />
        <h1>Prof. Dr. Necmettin Erbakan Fen Lisesi Pansiyon ve Yurt Bilgi Sistemi</h1>
        <p>{setup ? "İlk kurulum: yönetici hesabını oluşturun" : "Personel girişi"}</p>
      </header>
      <div className="auth">
        <form onSubmit={go} className="card">
          {setup && (<><label>Ad soyad</label><input onChange={set("full_name")} required /></>)}
          <label>Kullanıcı adı</label>
          <input onChange={set(setup ? "username" : "ident")} autoComplete="username" required />
          <label>Şifre</label><input type="password" onChange={set("password")} autoComplete={setup ? "new-password" : "current-password"} required />
          {box}<button className="btn" style={{ width: "100%" }}>{setup ? "Yöneticiyi oluştur" : "Giriş yap"}</button>
        </form>
        {!setup && <a className="btn ghost lnk" href="/veli">Veli: izin talebi (giriş gerekmez)</a>}
      </div>
      <footer className="foot">KVKK uyumludur · Tüm hakları saklıdır.</footer>
    </div>
  );
}

function ChangePw({ onDone }) {
  const [pw, setPw] = useState(""); const [run, box] = useAction();
  return (
    <div className="auth"><h1>Yeni şifre belirleyin</h1><p>Geçici şifreyle giriş yaptınız. Devam etmek için şifrenizi değiştirin.</p>
      <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("password", { password: pw }); onDone(); }); }}>
        <label>Yeni şifre (en az 8 karakter, harf ve rakam)</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
        {box}<button className="btn">Şifreyi kaydet</button></form></div>
  );
}

function Attendance({ students }) {
  const [session, setSession] = useState("etut"); const [map, setMap] = useState({}); const [run, box] = useAction();
  useEffect(() => { api("attendance?session=" + session).then((d) => setMap(Object.fromEntries(d.rows.map((r) => [r.student_id, r.state])))).catch(() => {}); }, [session]);
  const mark = (id, state) => run(async () => { await api("attendance", { student_id: id, session, state }); setMap((m) => ({ ...m, [id]: state })); });
  const rooms = {}; students.forEach((s) => (rooms[s.room] ||= []).push(s));
  const count = (k) => students.filter((s) => map[s.id] === k).length;
  return (<>
    <h2>Yoklama</h2>
    <div className="bar"><select value={session} onChange={(e) => setSession(e.target.value)} aria-label="Yoklama türü"><option value="etut">Etüt yoklaması</option><option value="yat">Yatış yoklaması</option></select></div>
    <div className="sum"><div><b>{students.length - Object.keys(map).length}</b>Bekleyen</div><div><b>{count("var")}</b>Var</div><div><b>{count("yok")}</b>Yok</div><div><b>{count("gec")}</b>Geç</div></div>
    {box}
    {Object.entries(rooms).map(([room, list]) => (
      <div className="room" key={room}><div className="no">{room}<small>oda</small></div>
        <div className="card" style={{ margin: 0 }}>{list.map((s) => (
          <div className="stu" key={s.id}><div className="n">{s.full_name}<small>{s.bed}. yatak</small></div>
            <div className="seg">{Object.keys(AT).map((k) => (<button key={k} className={k + (map[s.id] === k ? " on" : "")} onClick={() => mark(s.id, k)}>{AT[k]}</button>))}</div></div>))}
        </div></div>))}
    {!students.length && <div className="card">Henüz öğrenci yok. Yönetici, Öğrenciler sekmesinden liste ekleyebilir.</div>}
  </>);
}

function Students({ me, students, reload }) {
  const [q, setQ] = useState(""); const [text, setText] = useState(""); const [res, setRes] = useState(null); const [run, box] = useAction();
  const list = students.filter((s) => (s.full_name + s.room).toLowerCase().includes(q.toLowerCase()));
  return (<>
    <h2>Öğrenciler</h2>
    <div className="bar"><input placeholder="Ad veya oda ara" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    {box}
    <div className="card">{list.map((s) => (
      <div className="stu" key={s.id}><div className="n">{s.full_name}<small>Oda {s.room} · {s.bed}. yatak · {s.gender === "K" ? "Kız" : "Erkek"}</small></div>
        <select style={{ width: 130 }} value={s.status} aria-label={s.full_name + " durumu"} onChange={(e) => run(async () => { await api("students/status", { id: s.id, status: e.target.value }); reload(); })}>
          {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>))}
      {!list.length && "Sonuç yok."}</div>
    {me.role === "yon" && (<div className="card"><h3>Toplu öğrenci ekle</h3>
      <p className="hint">Her satıra bir öğrenci, noktalı virgülle ayırın:<br /><code>Ad Soyad;Oda;Yatak;Cinsiyet (K/E);Anne Adı;Anne Tel;Baba Adı;Baba Tel</code><br />En az bir veli telefonu zorunludur. Excel'den kopyalıp yapıştırabilirsiniz.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Zeynep Çelik;201;2;K;Ayşe Çelik;05551112233;Hasan Çelik;05554445566" />
      <button className="btn" onClick={() => run(async () => { const r = await api("students/import", { text }); setRes(r); setText(""); reload(); })}>Listeyi kaydet</button>
      {res && <div className="ok">{res.added} öğrenci eklendi.</div>}
      {res?.errors.map((x, i) => <div className="err" key={i}>{x}</div>)}</div>)}
  </>);
}

function Leaves({ me, students }) {
  const [rows, setRows] = useState([]); const [f, setF] = useState({ kind: "Hafta sonu" }); const [run, box] = useAction();
  const load = useCallback(() => api("leaves").then((d) => setRows(d.leaves)), []);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const fmt = (d) => new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  return (<>
    <h2>İzinler</h2>{box}
    {me.role !== "veli" && (<form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("leaves", f); load(); }, "İzin kaydedildi"); }}>
      <h3>Yeni izin</h3>
      <label>Öğrenci</label><select required onChange={set("student_id")} defaultValue=""><option value="" disabled>Seçin</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name} (Oda {s.room})</option>)}</select>
      <label>Tür</label><select value={f.kind} onChange={set("kind")}><option>Hafta sonu</option><option>Hastalık</option><option>Özel durum</option></select>
      <label>Çıkış</label><input type="datetime-local" required onChange={set("starts_at")} />
      <label>Dönüş</label><input type="datetime-local" required onChange={set("ends_at")} />
      <label>Açıklama</label><input onChange={set("reason")} />
      <button className="btn">İzni kaydet</button></form>)}
    <div className="card">{rows.map((l) => (<div className="stu" key={l.id}><div className="n">{l.full_name}<small>{l.kind} · {fmt(l.starts_at)} – {fmt(l.ends_at)}</small></div></div>))}{!rows.length && "Kayıtlı izin yok."}</div>
  </>);
}

function Mine({ students }) {
  return (<><h2>Çocuklarım</h2>
    {students.map((s) => (<div className="card" key={s.id}><h3>{s.full_name}</h3>Oda {s.room} · {s.bed}. yatak <span className={"pill " + s.status} style={{ marginLeft: 8 }}>{ST[s.status]}</span></div>))}
    {!students.length && <div className="card">Bu T.C. numarasına bağlı öğrenci bulunamadı. Okul yönetimiyle iletişime geçin.</div>}
    <Leaves me={{ role: "veli" }} students={students} /></>);
}

function Users() {
  const [list, setList] = useState([]); const [f, setF] = useState({ scope: "K" }); const [cred, setCred] = useState(null); const [run, box] = useAction();
  const load = () => api("users").then((d) => setList(d.users));
  useEffect(() => { load(); }, []);
  return (<><h2>Kullanıcılar</h2>
    <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { setCred(await api("users", f)); load(); }); }}>
      <h3>Belletmen ekle</h3>
      <label>Ad soyad</label><input required onChange={(e) => setF({ ...f, full_name: e.target.value })} />
      <label>Kullanıcı adı</label><input required onChange={(e) => setF({ ...f, username: e.target.value })} />
      <label>Sorumlu olduğu bölüm</label>
      <select value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}><option value="K">Kız öğrenciler</option><option value="E">Erkek öğrenciler</option></select>
      {box}{cred && <div className="ok">Geçici şifre (bir kez gösterilir): <b>{cred.password}</b> · kullanıcı adı: {cred.username}</div>}
      <button className="btn">Hesap oluştur</button></form>
    <div className="card">{list.map((u) => (<div className="stu" key={u.id}><div className="n">{u.full_name}<small>{u.username} · {ROLE[u.role]}{u.scope ? (u.scope === "K" ? " (kız)" : " (erkek)") : ""}</small></div></div>))}</div></>);
}

export default function Home() {
  const [st, setSt] = useState(null); const [students, setStudents] = useState([]); const [tab, setTab] = useState(null);
  const boot = useCallback(async () => {
    const d = await api("me"); setSt(d);
    if (d.user && !d.user.must_change) setStudents((await api("students")).students);
  }, []);
  useEffect(() => { boot(); }, [boot]);
  if (!st) return <main>Yükleniyor…</main>;
  if (!st.user) return <Auth setup={st.setup} onDone={boot} />;
  if (st.user.must_change) return <ChangePw onDone={boot} />;
  const me = st.user;
  const tabs = me.role === "bel" ? ["Yoklama", "Öğrenciler", "İzinler"] : ["Yoklama", "Öğrenciler", "İzinler", "Kullanıcılar"];
  const cur = tab && tabs.includes(tab) ? tab : tabs[0];
  return (<>
    <div className="top"><b>Pansiyon Takip</b><span>{me.full_name} · {ROLE[me.role]}{me.scope ? (me.scope === "K" ? " (kız)" : " (erkek)") : ""}</span>
      <button className="btn ghost" style={{ margin: 0, color: "#fff", borderColor: "#4a5c82" }} onClick={async () => { await api("logout", {}); boot(); }}>Çıkış</button></div>
    <nav className="tabs">{tabs.map((t) => <button key={t} className={t === cur ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</nav>
    <main>
      {cur === "Çocuklarım" && <Mine students={students} />}
      {cur === "Yoklama" && <Attendance students={students} />}
      {cur === "Öğrenciler" && <Students me={me} students={students} reload={boot} />}
      {cur === "İzinler" && <Leaves me={me} students={students} />}
      {cur === "Kullanıcılar" && <Users />}
    </main></>);
}
