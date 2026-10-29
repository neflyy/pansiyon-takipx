"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { api, todayStr, fmt, fmtPhone, Logo, Footer, VeliLogin, useAction } from "@/components/ui";

const ST = { yurtta: "Yurtta", etutte: "Etütte", revir: "Revirde" };
const ROLE = { yon: "Yönetici", bel: "Belletmen" };

function Gate({ setup, onDone }) {
  const [role, setRole] = useState("veli"); const [f, setF] = useState({}); const [run, box] = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (e) => { e.preventDefault(); run(async () => { await api(setup ? "setup" : "login", f); onDone(); }); };
  const R = [["veli", "👨‍👩‍👧", "Veli Girişi", "Cep telefonu ile"], ["bel", "🧑‍🏫", "Belletmen", "Kullanıcı adı ile"], ["yon", "🛡️", "Yönetici", "İdare paneli"]];
  return (
    <div className="gate">
      <header className="gh"><Logo s={46} /><div><small>PROF. DR. NECMETTİN ERBAKAN</small><b>FEN LİSESİ</b><span>Pansiyon ve Yurt Bilgi Sistemi</span></div></header>
      <main className="gm"><section className="split">
        <aside className="side"><div className="lgbox"><Logo s={120} /></div><small>PROF. DR. NECMETTİN ERBAKAN</small><h1>FEN LİSESİ</h1><p>Pansiyon ve Yurt Bilgi Sistemi</p></aside>
        <div className="pane">
          {setup ? (<>
            <h2>İlk Kurulum</h2><p className="hint">Yönetici hesabını oluşturun.</p>
            <form onSubmit={go}>
              <label>Ad soyad</label><input onChange={set("full_name")} required />
              <label>Kullanıcı adı</label><input onChange={set("username")} autoComplete="username" required />
              <label>Şifre</label><input type="password" onChange={set("password")} autoComplete="new-password" required />
              {box}<button className="btn">Yöneticiyi oluştur</button>
            </form></>) : (<>
            <h2>Sisteme Giriş Yapın</h2><p className="hint">Lütfen işlem yapmak istediğiniz kullanıcı rolünü seçiniz.</p>
            <div className="roles">{R.map(([k, i, t, s]) => (
              <button key={k} type="button" className={"role" + (role === k ? " on" : "")} onClick={() => setRole(k)}><span className="ic">{i}</span><b>{t}</b><small>{s}</small></button>))}</div>
            {role === "veli" ? <VeliLogin onDone={() => { window.location.href = "/veli"; }} /> : (
              <form key={role} onSubmit={go}>
                <label>Kullanıcı adı</label><input onChange={set("ident")} autoComplete="username" required />
                <label>Şifre</label><input type="password" onChange={set("password")} autoComplete="current-password" required />
                {box}<button className="btn">Giriş Yap</button>
              </form>)}
          </>)}
        </div>
      </section></main>
      <Footer />
    </div>
  );
}

function ChangePw({ onDone }) {
  const [pw, setPw] = useState(""); const [run, box] = useAction();
  return (
    <div className="gate"><main className="gm"><div className="card" style={{ maxWidth: 420, margin: "10vh auto 0", width: "100%" }}>
      <h2>Yeni şifre belirleyin</h2><p className="hint">Geçici şifreyle giriş yaptınız. Devam etmek için şifrenizi değiştirin.</p>
      <form onSubmit={(e) => { e.preventDefault(); run(async () => { await api("password", { password: pw }); onDone(); }); }}>
        <label>Yeni şifre (en az 8 karakter, harf ve rakam)</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
        {box}<button className="btn">Şifreyi kaydet</button></form></div></main></div>
  );
}

function Attendance({ students, tick }) {
  const [session, setSession] = useState("etut"); const [day, setDay] = useState(todayStr());
  const [map, setMap] = useState({}); const [leave, setLeave] = useState(new Set());
  const [floor, setFloor] = useState("all"); const [q, setQ] = useState(""); const [ask, setAsk] = useState(null);
  const [run, box, setMsg] = useAction();
  useEffect(() => {
    api(`attendance?session=${session}&day=${day}`).then((d) => { setMap(Object.fromEntries(d.rows.map((r) => [r.student_id, r.state]))); setLeave(new Set(d.onleave)); }).catch(() => {});
  }, [session, day, tick]);
  const mark = (s, state, notify) => run(async () => {
    const r = await api("attendance", { student_id: s.id, session, day, state, notify });
    setMap((m) => ({ ...m, [s.id]: state }));
    if (r.note) setMsg({ ok: r.note });
  });
  const floors = useMemo(() => [...new Set(students.map((s) => Math.floor(s.room / 100)))].sort(), [students]);
  const list = students.filter((s) => (floor === "all" || Math.floor(s.room / 100) === floor) && (s.full_name + s.room).toLowerCase().includes(q.toLowerCase()));
  const onL = students.filter((s) => leave.has(s.id));
  const count = (k) => students.filter((s) => !leave.has(s.id) && map[s.id] === k).length;
  const send = (who) => { const s = ask; setAsk(null); mark(s, "yok", who); };
  return (<>
    <div className="stats">
      <div className="stat blue"><small>Toplam Öğrenci</small><b>{students.length}</b></div>
      <div className="stat green"><small>Yurtta (Var)</small><b>{count("var")}</b></div>
      <div className="stat orange"><small>Yoklamada Yok</small><b>{count("yok")}</b></div>
      <div className="stat red"><small>İzinli</small><b>{onL.length}</b></div>
    </div>
    <div className="card"><div className="bar">
      <label className="inl">Yoklama Seansı:<input type="date" value={day} onChange={(e) => setDay(e.target.value || todayStr())} /></label>
      <select value={session} onChange={(e) => setSession(e.target.value)} aria-label="Yoklama türü"><option value="etut">1. Etüt Yoklaması (19:30)</option><option value="yat">Yatış Yoklaması (22:00)</option></select>
    </div>{box}</div>
    <div className="card"><div className="bar">
      <div className="chips"><button className={"chip" + (floor === "all" ? " on" : "")} onClick={() => setFloor("all")}>Tüm Katlar</button>
        {floors.map((f) => <button key={f} className={"chip" + (floor === f ? " on" : "")} onClick={() => setFloor(f)}>{f}. Kat</button>)}</div>
      <input placeholder="Öğrenci adı veya oda ara..." value={q} onChange={(e) => setQ(e.target.value)} />
    </div></div>
    <div className="grid">{list.map((s) => {
      const isL = leave.has(s.id);
      return (
        <div key={s.id} className={"sc" + (isL ? " leave" : "") + (!isL && map[s.id] === "yok" ? " absent" : "")}>
          <div><span className="tag">{Math.floor(s.room / 100)}. Kat • Oda {s.room}</span><div className="nm">{s.full_name}</div></div>
          {isL ? <span className="lv">İZİNLİ</span> : (
            <div className="seg">
              <button className={"var" + (map[s.id] === "var" ? " on" : "")} onClick={() => mark(s, "var")}>Var</button>
              <button className={"yok" + (map[s.id] === "yok" ? " on" : "")} onClick={() => setAsk(s)}>Yok</button>
            </div>)}
        </div>);
    })}</div>
    {!list.length && <div className="card">Öğrenci bulunamadı.</div>}
    {ask && (
      <div className="ov" onClick={() => setAsk(null)}><div className="md card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{ask.full_name} — Yok</h3>
        <p className="hint">Veliye “mazeretsiz katılmamıştır” bilgisi WhatsApp'tan gönderilsin mi?</p>
        <button className="btn" disabled={!ask.mother_phone} onClick={() => send("anne")}>Anneye gönder{ask.mother_name ? ` (${ask.mother_name})` : ""}</button>
        <button className="btn" disabled={!ask.father_phone} onClick={() => send("baba")}>Babaya gönder{ask.father_name ? ` (${ask.father_name})` : ""}</button>
        <button className="btn ghost" onClick={() => send(null)}>Mesaj göndermeden kaydet</button>
        <button className="btn ghost" onClick={() => setAsk(null)}>Vazgeç</button>
      </div></div>)}
  </>);
}

function Students({ me, students, reload }) {
  const [q, setQ] = useState(""); const [text, setText] = useState(""); const [res, setRes] = useState(null); const [run, box] = useAction();
  const admin = me.role === "yon";
  const list = students.filter((s) => (s.full_name + s.room).toLowerCase().includes(q.toLowerCase()));
  return (<>
    {admin && (<div className="card"><h3>Excel'den Toplu Yapıştır</h3>
      <p className="hint">Her satıra bir öğrenci, noktalı virgülle ayırın:<br /><code>Ad Soyad;Oda;Yatak;Cinsiyet (K/E);Anne Adı;Anne Tel;Baba Adı;Baba Tel</code><br />En az bir veli telefonu zorunludur.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Zeynep Çelik;201;2;K;Ayşe Çelik;05551112233;Hasan Çelik;05554445566" />
      <button className="btn" onClick={() => run(async () => { const r = await api("students/import", { text }); setRes(r); setText(""); reload(); })}>Buluta Aktar</button>
      {res && <div className="ok">{res.added} öğrenci eklendi.</div>}
      {res?.errors.map((x, i) => <div className="err" key={i}>{x}</div>)}</div>)}
    <div className="card"><div className="bar"><input placeholder="Ad veya oda ara" value={q} onChange={(e) => setQ(e.target.value)} /></div>{box}
      <div className="tw"><table className="tbl"><thead><tr><th>Ad Soyad</th><th>Pansiyon</th><th>Oda</th>{admin && <><th>Anne (Tel)</th><th>Baba (Tel)</th></>}<th>Durum</th>{admin && <th></th>}</tr></thead>
        <tbody>{list.map((s) => (
          <tr key={s.id}><td><b>{s.full_name}</b></td><td>{s.gender === "K" ? "Kız" : "Erkek"}</td><td>{s.room} / {s.bed}</td>
            {admin && <><td>{s.mother_name || "-"}<small>{fmtPhone(s.mother_phone)}</small></td><td>{s.father_name || "-"}<small>{fmtPhone(s.father_phone)}</small></td></>}
            <td>{s.on_leave ? <span className="lv">İZİNLİ</span> : (
              <select value={s.status === "izinli" ? "yurtta" : s.status} aria-label={s.full_name + " durumu"} onChange={(e) => run(async () => { await api("students/status", { id: s.id, status: e.target.value }); reload(); })}>
                {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>)}</td>
            {admin && <td><button className="btn red sm" onClick={() => { if (confirm(s.full_name + " silinsin mi?")) run(async () => { await api("students/delete", { id: s.id }); reload(); }); }}>Sil</button></td>}
          </tr>))}</tbody></table></div>
      {!list.length && "Kayıtlı öğrenci yok."}</div>
    {admin && students.length > 0 && <div className="card"><button className="btn red" onClick={() => { if (confirm("Tüm öğrenciler, yoklama ve izin kayıtları silinecek. Emin misiniz?")) run(async () => { await api("students/reset", {}); reload(); }); }}>Tüm Öğrencileri Sıfırla</button></div>}
  </>);
}

function Leaves({ students }) {
  const [rows, setRows] = useState([]); const [f, setF] = useState({ kind: "Hafta sonu" }); const [run, box] = useAction();
  const load = useCallback(() => api("leaves").then((d) => setRows(d.leaves)), []);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (<>
    <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("leaves", f); load(); }, "İzin kaydedildi"); }}>
      <h3>Yeni izin</h3>
      <label>Öğrenci</label><select required onChange={set("student_id")} defaultValue=""><option value="" disabled>Seçin</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name} (Oda {s.room})</option>)}</select>
      <label>Tür</label><select value={f.kind} onChange={set("kind")}><option>Hafta sonu</option><option>Hastalık</option><option>Özel durum</option></select>
      <label>Çıkış</label><input type="datetime-local" required onChange={set("starts_at")} />
      <label>Dönüş</label><input type="datetime-local" required onChange={set("ends_at")} />
      <label>Açıklama</label><input onChange={set("reason")} />
      {box}<button className="btn">İzni kaydet</button></form>
    <div className="card"><h3>Son izinler</h3>{rows.map((l) => (<div className="stu" key={l.id}><div className="n">{l.full_name}<small>{l.kind} · {fmt(l.starts_at)} – {fmt(l.ends_at)}{l.requested_by_phone ? " · veli talebi" : ""}</small></div></div>))}{!rows.length && "Kayıtlı izin yok."}</div>
  </>);
}

function Users() {
  const [list, setList] = useState([]); const [f, setF] = useState({ scope: "K" }); const [cred, setCred] = useState(null); const [run, box] = useAction();
  const load = () => api("users").then((d) => setList(d.users));
  useEffect(() => { load(); }, []);
  return (<>
    <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { setCred(await api("users", f)); load(); }); }}>
      <h3>Belletmen ekle</h3>
      <label>Ad soyad</label><input required onChange={(e) => setF({ ...f, full_name: e.target.value })} />
      <label>Kullanıcı adı</label><input required onChange={(e) => setF({ ...f, username: e.target.value })} />
      <label>Sorumlu olduğu bölüm</label>
      <select value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}><option value="K">Kız öğrenciler</option><option value="E">Erkek öğrenciler</option></select>
      {box}{cred && <div className="ok">Geçici şifre (bir kez gösterilir): <b>{cred.password}</b> · kullanıcı adı: {cred.username}</div>}
      <button className="btn">Hesap oluştur</button></form>
    <div className="card">{list.map((u) => (<div className="stu" key={u.id}><div className="n">{u.full_name}<small>{u.username} · {ROLE[u.role]}{u.scope ? (u.scope === "K" ? " (kız)" : " (erkek)") : ""}</small></div></div>))}</div>
  </>);
}

export default function Home() {
  const [st, setSt] = useState(null); const [students, setStudents] = useState([]); const [tab, setTab] = useState(null); const [tick, setTick] = useState(0);
  const boot = useCallback(async () => {
    const d = await api("me"); setSt(d);
    if (d.user && !d.user.must_change) setStudents((await api("students")).students);
  }, []);
  useEffect(() => { boot(); }, [boot]);
  const refresh = async () => { await boot(); setTick((t) => t + 1); };
  if (!st) return <main className="wrap">Yükleniyor…</main>;
  if (!st.user) return <Gate setup={st.setup} onDone={boot} />;
  if (st.user.must_change) return <ChangePw onDone={boot} />;
  const me = st.user;
  const tabs = me.role === "bel" ? ["Yoklama", "Öğrenciler", "İzinler"] : ["Yoklama", "Öğrenciler", "İzinler", "Kullanıcılar"];
  const cur = tab && tabs.includes(tab) ? tab : tabs[0];
  const title = me.role === "yon" ? "İDARE PANELİ" : me.scope === "K" ? "KIZ PANSİYONU NÖBET EKRANI" : "ERKEK PANSİYONU NÖBET EKRANI";
  return (<div className="gate">
    <header className="ph"><div className="pl"><Logo s={46} /><div><small>{title}</small><b>{me.full_name}</b></div></div>
      <div className="pr"><button className="btn ghost sm" onClick={refresh}>🔄 Listeyi Yenile</button>
        <button className="btn red sm" onClick={async () => { await api("logout", {}); boot(); }}>Çıkış</button></div></header>
    <main className="wrap">
      <nav className="pills">{tabs.map((t) => <button key={t} className={"pill" + (t === cur ? " on" : "")} onClick={() => setTab(t)}>{t}{t === "Yoklama" || t === "Öğrenciler" ? ` (${students.length})` : ""}</button>)}</nav>
      {cur === "Yoklama" && <Attendance students={students} tick={tick} />}
      {cur === "Öğrenciler" && <Students me={me} students={students} reload={refresh} />}
      {cur === "İzinler" && <Leaves students={students} />}
      {cur === "Kullanıcılar" && <Users />}
    </main><Footer /></div>);
}
