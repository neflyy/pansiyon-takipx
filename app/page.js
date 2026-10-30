"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { api, todayStr, fmt, fmtPhone, Logo, Footer, VeliLogin, Loader, useAction } from "@/components/ui";

const ST = { yurtta: "Yurtta", etutte: "Etütte", revir: "Revirde" };
const SES = { etut: "1. Etüt Yoklaması (19:30)", yat: "Gece Yat Yoklaması (22:00)" };
const dmy = (d) => String(d).slice(0, 10).split("-").reverse().join(".");
const logText = (a) => {
  const [k, ...r] = a.split(":");
  const who = { anne: "anneye", baba: "babaya" };
  const M = {
    giris: () => "Sisteme giriş yaptı", sifre_degisti: () => "Şifresini değiştirdi", ogrenciler_sifirlandi: () => "Tüm öğrencileri sıfırladı",
    nobet_defteri: () => "Nöbet defterine kayıt ekledi/düzenledi", nobet_silindi: () => "Nöbet defteri kaydını sildi",
    import: () => `${r[0]} öğrenci içe aktardı`, ogrenci_eklendi: () => `Öğrenci ekledi: ${r.join(":")}`, ogrenci_silindi: () => "Öğrenci sildi",
    durum: () => "Öğrenci durumunu değiştirdi", izin: () => "İzin kaydetti", veli_izin: () => "Veli izin talebi oluşturdu",
    veli_giris: () => `Veli girişi (…${r[0]})`, belletmen: () => `Belletmen hesabı oluşturdu: ${r[0]}`, belletmen_guncellendi: () => "Belletmen bilgilerini güncelledi",
    sifre_sifirlandi: () => `Belletmen şifresini sıfırladı: ${r[0]}`, belletmen_silindi: () => "Belletmen hesabını sildi",
    yoklama: () => `${dmy(r[0])} ${r[1] === "yat" ? "yat" : "etüt"} yoklamasını kaydetti (${r[2]} öğrenci)`,
    bildirim: () => `${r[0]} için ${who[r[1]] || ""} devamsızlık mesajı gönderdi`,
  };
  return (M[k] || (() => a))();
};
const ROLE = { yon: "Yönetici", bel: "Belletmen" };

function Gate({ setup, onDone }) {
  const [role, setRole] = useState("veli"); const [f, setF] = useState({}); const [run, box] = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (e) => { e.preventDefault(); run(async () => { await api(setup ? "setup" : "login", !setup && role === "yon" ? { role: "yon", password: f.password } : f); onDone(); }); };
  const R = [["veli", "👨‍👩‍👧", "Veli Girişi", "Cep telefonu ile"], ["bel", "🧑‍🏫", "Belletmen", "Kullanıcı adı ile"], ["yon", "🛡️", "Yönetici", "İdare paneli"]];
  return (
    <div className="gate login">
      <header className="gh"><Logo s={46} /><div><small>PROF. DR. NECMETTİN ERBAKAN</small><b>FEN LİSESİ</b><span>Pansiyon ve Yurt Bilgi Sistemi</span></div></header>
      <main className="gm">
        <div className="deco" aria-hidden="true">{[["📚", "7%", "12%", "0s"], ["🎓", "86%", "9%", "1.2s"], ["✏️", "4%", "66%", "2.1s"], ["🔬", "90%", "60%", "0.6s"], ["💡", "44%", "4%", "1.8s"], ["📐", "22%", "87%", "2.6s"], ["🧪", "74%", "86%", "0.9s"], ["🌍", "63%", "5%", "3s"]].map(([e, l, t, d], i) => <span key={i} style={{ left: l, top: t, animationDelay: d }}>{e}</span>)}</div>
        <section className="split">
        <aside className="side"><div className="lgbox"><Logo s={120} /></div><small>PROF. DR. NECMETTİN ERBAKAN</small><h1>FEN LİSESİ</h1><p>Pansiyon ve Yurt Bilgi Sistemi</p><div className="motto">BİLİM • EĞİTİM • GELECEK</div></aside>
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
                {role === "bel" && (<><label>Kullanıcı adı</label><input onChange={set("ident")} autoComplete="username" required /></>)}
                <label>{role === "yon" ? "Yönetici şifresi" : "Şifre"}</label>
                <input type="password" className={role === "yon" ? "big" : undefined} onChange={set("password")} autoComplete="current-password" required />
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
  const [map, setMap] = useState({}); const [orig, setOrig] = useState("{}"); const [notified, setNotified] = useState({}); const [leave, setLeave] = useState(new Set());
  const [floor, setFloor] = useState("all"); const [q, setQ] = useState("");
  const [run, box, setMsg] = useAction();
  const dirty = JSON.stringify(map) !== orig;
  const load = useCallback(() => api(`attendance?session=${session}&day=${day}`).then((d) => {
    const m = Object.fromEntries(d.rows.map((r) => [r.student_id, r.state]));
    setMap(m); setOrig(JSON.stringify(m));
    setNotified(Object.fromEntries(d.rows.filter((r) => r.notified).map((r) => [r.student_id, r.notified])));
    setLeave(new Set(d.onleave));
  }).catch(() => {}), [session, day]);
  useEffect(() => { load(); }, [load, tick]);
  const guard = (fn) => { if (dirty && !confirm("Kaydedilmemiş yoklama değişiklikleri var. Silinsin mi?")) return; fn(); };
  const pick = (s, st) => setMap((m) => { const n = { ...m }; if (n[s.id] === st) delete n[s.id]; else n[s.id] = st; return n; });
  const notify = (s, who) => run(async () => {
    await api("attendance/notify", { student_id: s.id, session, day, who });
    setNotified((n) => ({ ...n, [s.id]: who }));
    setMsg({ ok: `${s.full_name}: ${who === "anne" ? "anneye" : "babaya"} mesaj gönderiliyor` });
  });
  const active = students.filter((s) => !leave.has(s.id));
  const save = () => {
    const marked = active.filter((s) => map[s.id]); const missing = active.length - marked.length;
    if (missing > 0 && !confirm(`${missing} öğrenci için işaretleme yapılmadı. Yine de kaydedilsin mi?`)) return;
    run(async () => {
      await api("attendance", { session, day, items: marked.map((s) => ({ student_id: s.id, state: map[s.id], notified: notified[s.id] || null })) });
      setOrig(JSON.stringify(map));
    }, "Yoklama kaydedildi ve veli geçmişine işlendi.");
  };
  const floors = useMemo(() => [...new Set(students.map((s) => Math.floor(s.room / 100)))].sort(), [students]);
  const list = students.filter((s) => (floor === "all" || Math.floor(s.room / 100) === floor) && (s.full_name + s.room).toLowerCase().includes(q.toLowerCase()));
  const count = (k) => active.filter((s) => map[s.id] === k).length;
  return (<>
    <div className="stats">
      <div className="stat blue"><small>Toplam Öğrenci</small><b>{students.length}</b></div>
      <div className="stat green"><small>Yurtta (Var)</small><b>{count("var")}</b></div>
      <div className="stat orange"><small>Yoklamada Yok</small><b>{count("yok")}</b></div>
      <div className="stat red"><small>İzinli</small><b>{students.length - active.length}</b></div>
    </div>
    <div className="card"><div className="bar">
      <label className="inl">Yoklama Seansı:<input type="date" value={day} onChange={(e) => { const v = e.target.value || todayStr(); guard(() => setDay(v)); }} /></label>
      <select value={session} onChange={(e) => { const v = e.target.value; guard(() => setSession(v)); }} aria-label="Yoklama türü">{Object.entries(SES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <button className="btn green" style={{ margin: 0, flex: "0 1 auto" }} onClick={save}>📥 Bu Seansın Yoklamasını Veli Geçmişine Kaydet</button>
    </div>{dirty && <p className="dirty">Kaydedilmemiş değişiklikler var. Kaydet düğmesine basmadan yoklama veli geçmişine işlenmez.</p>}{box}</div>
    <div className="card"><div className="bar">
      <div className="chips"><button className={"chip" + (floor === "all" ? " on" : "")} onClick={() => setFloor("all")}>Tüm Katlar</button>
        {floors.map((f) => <button key={f} className={"chip" + (floor === f ? " on" : "")} onClick={() => setFloor(f)}>{f}. Kat</button>)}</div>
      <input placeholder="🔍 Öğrenci adı veya oda ara..." value={q} onChange={(e) => setQ(e.target.value)} />
    </div></div>
    <div className="grid">{list.map((s) => {
      const isL = leave.has(s.id); const st = map[s.id]; const n = notified[s.id];
      return (
        <div key={s.id} className={"sc" + (isL ? " leave" : "") + (!isL && st === "yok" ? " absent" : "")}>
          <div><span className="tag">{Math.floor(s.room / 100)}. Kat • Oda {s.room}</span><div className="nm">{s.full_name}</div></div>
          {isL ? <span className="lv">İZİNLİ</span> : (
            <div className="seg">
              <button className={"var" + (st === "var" ? " on" : "")} onClick={() => pick(s, "var")}>Var</button>
              <button className={"yok" + (st === "yok" ? " on" : "")} onClick={() => pick(s, "yok")}>Yok</button>
            </div>)}
          {!isL && st === "yok" && (
            <div className="wap"><b>🚨 Veliye WhatsApp Devamsızlık Mesajı:</b>
              <div className="wab">
                <button className="wb a" disabled={!s.mother_phone || !!n} onClick={() => notify(s, "anne")}>{n === "anne" ? "✔ Anneye gönderildi" : s.mother_phone ? `Anneye Gönder (${fmtPhone(s.mother_phone)})` : "Anne numarası yok"}</button>
                <button className="wb b" disabled={!s.father_phone || !!n} onClick={() => notify(s, "baba")}>{n === "baba" ? "✔ Babaya gönderildi" : s.father_phone ? `Babaya Gönder (${fmtPhone(s.father_phone)})` : "Baba numarası yok"}</button>
              </div></div>)}
        </div>);
    })}</div>
    {!list.length && <div className="card">Öğrenci bulunamadı.</div>}
  </>);
}

function Students({ students, reload }) {
  const [q, setQ] = useState(""); const [text, setText] = useState(""); const [res, setRes] = useState(null);
  const [f, setF] = useState({ gender: "E", kat: "1", oda: "" }); const [run, box] = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const list = students.filter((s) => [s.full_name, s.room, s.mother_name, s.father_name].join(" ").toLowerCase().includes(q.toLowerCase()));
  const add = (e) => {
    e.preventDefault();
    const oda = +f.oda; const room = oda >= 100 ? oda : (+f.kat) * 100 + oda;
    run(async () => { await api("students/add", { full_name: f.full_name, gender: f.gender, room, mother_name: f.mother_name, mother_phone: f.mother_phone, father_name: f.father_name, father_phone: f.father_phone }); setF({ gender: f.gender, kat: f.kat, oda: "" }); reload(); }, "Öğrenci kaydedildi.");
  };
  const onFile = async (e) => {
    const file = e.target.files[0]; e.target.value = ""; if (!file) return;
    run(async () => {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false, raw: false });
      const lines = rows.filter((r) => r[0] && !/ad\s*soyad/i.test(String(r[0]))).map((r) => Array.from({ length: 8 }, (_, i) => String(r[i] ?? "").trim()).join(";"));
      if (!lines.length) throw new Error("Dosyada okunacak satır bulunamadı");
      setRes(await api("students/import", { text: lines.join("\n") })); reload();
    });
  };
  const val = (k) => f[k] || "";
  return (<>
    <div className="card">
      <div className="hd"><div><h3>➕ Yeni Öğrenci Ekle</h3><p className="hint">Veli numarası boş bırakılabilir (numarasız veli portala giremez).</p></div>
        {students.length > 0 && <button className="btn red sm" onClick={() => { if (confirm("Tüm öğrenciler, yoklama ve izin kayıtları silinecek. Emin misiniz?")) run(async () => { await api("students/reset", {}); reload(); }); }}>🗑️ Tüm Öğrencileri Sıfırla</button>}</div>
      <form onSubmit={add}>
        <div className="fgrid">
          <input placeholder="Ad Soyad" value={val("full_name")} onChange={set("full_name")} required />
          <select value={f.gender} onChange={set("gender")}><option value="E">Erkek Pansiyonu</option><option value="K">Kız Pansiyonu</option></select>
          <select value={f.kat} onChange={set("kat")}><option value="1">1. Kat</option><option value="2">2. Kat</option><option value="3">3. Kat</option></select>
          <input placeholder="Oda (örn. 3 veya 103)" inputMode="numeric" value={val("oda")} onChange={set("oda")} required />
          <input placeholder="Anne Adı" value={val("mother_name")} onChange={set("mother_name")} />
          <input placeholder="Anne Tel" inputMode="tel" value={val("mother_phone")} onChange={set("mother_phone")} />
          <input placeholder="Baba Adı" value={val("father_name")} onChange={set("father_name")} />
          <input placeholder="Baba Tel" inputMode="tel" value={val("father_phone")} onChange={set("father_phone")} />
        </div>
        {box}<button className="btn" style={{ width: "auto", marginLeft: "auto" }}>Öğrenciyi Kaydet</button>
      </form>
      <hr className="sep" />
      <h3>📥 Excel'den Toplu Yükle</h3>
      <p className="hint">Sütunlar: <code>Ad Soyad | Cinsiyet | Kat | Oda | Anne Adı | Anne Tel | Baba Adı | Baba Tel</code>. Dosya yükleyebilir ya da Excel'den kopyalayıp aşağıya yapıştırabilirsiniz.</p>
      <label className="btn green filebtn">📂 Excel Dosyası Yükle (.xlsx, .xls, .csv)<input type="file" accept=".xlsx,.xls,.csv" hidden onChange={onFile} /></label>
      <textarea style={{ marginTop: 10 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ad Soyad | Cinsiyet | Kat | Oda | Anne Adı | Anne Tel | Baba Adı | Baba Tel" />
      <button className="btn green" style={{ width: "auto", marginLeft: "auto" }} onClick={() => run(async () => { setRes(await api("students/import", { text })); setText(""); reload(); })}>Buluta Aktar</button>
      {res && <div className="ok">{res.added} öğrenci eklendi.</div>}
      {res?.errors.slice(0, 15).map((x, i) => <div className="err" key={i}>{x}</div>)}
    </div>
    <div className="card"><div className="bar"><input placeholder="🔍 Öğrenci adı veya oda ara..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="tw"><table className="tbl"><thead><tr><th>Ad Soyad</th><th>Pansiyon</th><th>Kat/Oda</th><th>Anne (Tel)</th><th>Baba (Tel)</th><th>Durum</th><th>İşlem</th></tr></thead>
        <tbody>{list.map((s) => (
          <tr key={s.id}><td><b>{s.full_name}</b></td><td>{s.gender === "K" ? "👧 Kız" : "👦 Erkek"}</td><td>{Math.floor(s.room / 100)}. Kat / {s.room}</td>
            <td>{s.mother_name || "-"}<small>{fmtPhone(s.mother_phone)}</small></td><td>{s.father_name || "-"}<small>{fmtPhone(s.father_phone)}</small></td>
            <td>{s.on_leave ? <span className="lv">İZİNLİ</span> : (
              <select value={s.status === "izinli" ? "yurtta" : s.status} aria-label={s.full_name + " durumu"} onChange={(e) => run(async () => { await api("students/status", { id: s.id, status: e.target.value }); reload(); })}>
                {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>)}</td>
            <td><button className="btn red sm" onClick={() => { if (confirm(s.full_name + " silinsin mi?")) run(async () => { await api("students/delete", { id: s.id }); reload(); }); }}>Sil</button></td>
          </tr>))}</tbody></table></div>
      {!list.length && <p>Kayıtlı öğrenci yok.</p>}</div>
  </>);
}

function Teachers() {
  const [list, setList] = useState([]); const [f, setF] = useState({ scope: "E" }); const [cred, setCred] = useState(null);
  const [ed, setEd] = useState(null); const [run, box] = useAction();
  const load = () => api("users").then((d) => setList(d.users.filter((x) => x.role === "bel")));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const sed = (k) => (e) => setEd({ ...ed, [k]: e.target.value });
  const show = (r, name) => setCred({ name, username: r.username, password: r.password });
  return (<>
    <div className="card"><h3>➕ Yeni Belletmen Öğretmen Ekle</h3>
      <form onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await api("users", f); show(r, f.full_name); setF({ scope: f.scope }); load(); }); }}>
        <div className="fgrid">
          <input placeholder="Ad Soyad" value={f.full_name || ""} onChange={set("full_name")} required />
          <select value={f.scope} onChange={set("scope")}><option value="E">Erkek Belletmen</option><option value="K">Kız Belletmen</option></select>
          <input placeholder="Branş" value={f.branch || ""} onChange={set("branch")} />
          <input placeholder="Telefon (isteğe bağlı)" value={f.phone || ""} onChange={set("phone")} />
          <input placeholder="Kullanıcı adı (boşsa otomatik)" value={f.username || ""} onChange={set("username")} />
          <input placeholder="Şifre (boşsa otomatik)" value={f.password || ""} onChange={set("password")} />
        </div>
        {box}<button className="btn" style={{ width: "auto", marginLeft: "auto" }}>Belletmeni Kaydet</button>
      </form>
      {cred && <div className="ok"><b>{cred.name}</b> için giriş bilgileri (yalnızca şimdi gösterilir): kullanıcı adı <b>{cred.username}</b> · şifre <b>{cred.password}</b><br />İlk girişte şifre değiştirmesi istenir.</div>}
    </div>
    <div className="card"><div className="tw"><table className="tbl"><thead><tr><th>Ad Soyad</th><th>Görev Bloğu</th><th>Branş</th><th>Telefon</th><th>Kullanıcı adı</th><th>İşlem</th></tr></thead>
      <tbody>{list.map((u) => ed?.id === u.id ? (
        <tr key={u.id}><td><input value={ed.full_name} onChange={sed("full_name")} /></td>
          <td><select value={ed.scope} onChange={sed("scope")}><option value="E">Erkek Pansiyonu</option><option value="K">Kız Pansiyonu</option></select></td>
          <td><input value={ed.branch || ""} onChange={sed("branch")} /></td><td><input value={ed.phone || ""} onChange={sed("phone")} /></td><td>{u.username}</td>
          <td className="ra"><button className="btn green sm" onClick={() => run(async () => { await api("users/update", ed); setEd(null); load(); })}>Kaydet</button><button className="btn ghost sm" onClick={() => setEd(null)}>İptal</button></td></tr>
      ) : (
        <tr key={u.id}><td><b>{u.full_name}</b></td><td>{u.scope === "K" ? "👧 Kız Pansiyonu" : "👦 Erkek Pansiyonu"}</td><td>{u.branch || "-"}</td><td>{u.phone || "-"}</td><td>{u.username}</td>
          <td className="ra"><button className="btn amber sm" onClick={() => setEd({ id: u.id, full_name: u.full_name, scope: u.scope, branch: u.branch, phone: u.phone })}>Düzenle</button>
            <button className="btn ghost sm" onClick={() => { if (confirm(u.full_name + " için şifre sıfırlansın mı?")) run(async () => { show(await api("users/reset", { id: u.id }), u.full_name); load(); }); }}>🔑 Şifre Sıfırla</button>
            <button className="btn red sm" onClick={() => { if (confirm(u.full_name + " silinsin mi?")) run(async () => { await api("users/delete", { id: u.id }); load(); }); }}>Sil</button></td></tr>))}</tbody></table></div>
      {!list.length && <p>Henüz belletmen yok.</p>}</div>
  </>);
}

function Duty({ me, onCount }) {
  const blank = () => ({ day: todayStr(), session: "etut", male_duty: "", female_duty: "", notes: "" });
  const [rows, setRows] = useState([]); const [f, setF] = useState(blank()); const [run, box] = useAction();
  const load = useCallback(() => api("duty").then((d) => { setRows(d.duty); onCount && onCount(d.duty.length); }), [onCount]);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (<>
    <form className="card noprint" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("duty", f); setF(blank()); load(); }, "Nöbet defteri kaydedildi."); }}>
      <h3>{f.id ? "✏️ Kaydı düzenle" : "📖 Nöbet defterine kayıt ekle"}</h3>
      <div className="fgrid">
        <input type="date" value={f.day} onChange={set("day")} required />
        <select value={f.session} onChange={set("session")}>{Object.entries(SES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input placeholder="Erkek pansiyonu nöbetçileri" value={f.male_duty || ""} onChange={set("male_duty")} />
        <input placeholder="Kız pansiyonu nöbetçileri" value={f.female_duty || ""} onChange={set("female_duty")} />
      </div>
      <textarea style={{ marginTop: 10 }} placeholder="Notlar" value={f.notes || ""} onChange={set("notes")} />
      {box}<div className="bar" style={{ justifyContent: "flex-end" }}>
        {f.id && <button type="button" className="btn ghost" style={{ flex: "0 0 auto", margin: 0 }} onClick={() => setF(blank())}>Vazgeç</button>}
        <button className="btn" style={{ flex: "0 0 auto", margin: 0 }}>Kaydet</button></div>
    </form>
    <div className="card printable">
      <div className="hd"><h3>📖 Kayıtlı Pansiyon Nöbet Defteri Tutanakları</h3><button className="btn ghost sm noprint" onClick={() => window.print()}>🖨️ PDF Çıktı Al</button></div>
      <p className="only-print">Prof. Dr. Necmettin Erbakan Fen Lisesi Pansiyonu — Nöbet Defteri</p>
      {rows.map((r) => (
        <div className="duty" key={r.id}>
          <div className="hd"><h4>📅 {dmy(r.day)} — {SES[r.session]}</h4>
            <div className="noprint"><button className="btn amber sm" onClick={() => { setF({ ...r }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Düzenle</button>
              {me.role === "yon" && <button className="btn red sm" onClick={() => { if (confirm("Kayıt silinsin mi?")) run(async () => { await api("duty/delete", { id: r.id }); load(); }); }}>Sil</button>}</div></div>
          <div className="two"><div className="box"><b>👦 Erkek Pansiyonu:</b> {r.male_duty || "-"}</div><div className="box"><b>👧 Kız Pansiyonu:</b> {r.female_duty || "-"}</div></div>
          <div className="box" style={{ marginTop: 10 }}><b>Notlar:</b> {r.notes}</div>
        </div>))}
      {!rows.length && <p>Henüz kayıt yok.</p>}
    </div>
  </>);
}

function Leaves({ students }) {
  const [rows, setRows] = useState([]); const [f, setF] = useState({ kind: "Hafta sonu" }); const [run, box] = useAction();
  const load = useCallback(() => api("leaves").then((d) => setRows(d.leaves)), []);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const now = Date.now();
  const active = rows.filter((l) => new Date(l.starts_at) <= now && new Date(l.ends_at) >= now);
  return (<>
    <div className="card"><h3>🟥 Şu an izinli öğrenciler ({active.length})</h3>
      {active.map((l) => (<div className="stu leaveRow" key={l.id}><div className="n">{l.full_name}<small>Oda {l.room} · {l.kind} · {fmt(l.starts_at)} – {fmt(l.ends_at)}{l.requested_by_phone ? " · veli talebi" : ""}</small></div></div>))}
      {!active.length && "Şu an izinli öğrenci yok."}</div>
    <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("leaves", f); load(); }, "İzin kaydedildi"); }}>
      <h3>Yeni izin</h3>
      <label>Öğrenci</label><select required onChange={set("student_id")} defaultValue=""><option value="" disabled>Seçin</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name} (Oda {s.room})</option>)}</select>
      <label>Tür</label><select value={f.kind} onChange={set("kind")}><option>Hafta sonu</option><option>Hastalık</option><option>Özel durum</option></select>
      <label>Çıkış</label><input type="datetime-local" required onChange={set("starts_at")} />
      <label>Dönüş</label><input type="datetime-local" required onChange={set("ends_at")} />
      <label>Açıklama</label><input onChange={set("reason")} />
      {box}<button className="btn">İzni kaydet</button></form>
    <div className="card"><h3>Son izin kayıtları</h3>{rows.map((l) => (<div className="stu" key={l.id}><div className="n">{l.full_name}<small>{l.kind} · {fmt(l.starts_at)} – {fmt(l.ends_at)}{l.requested_by_phone ? " · veli talebi" : ""}</small></div></div>))}{!rows.length && "Kayıtlı izin yok."}</div>
  </>);
}

function Logs() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api("logs").then((d) => setRows(d.logs)).catch(() => {}); }, []);
  return (<div className="card"><h3>📋 Son işlem kayıtları</h3>
    <div className="tw"><table className="tbl"><thead><tr><th>Zaman</th><th>Kullanıcı</th><th>İşlem</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id}><td>{fmt(r.created_at)}</td><td>{r.full_name || "Veli / sistem"}</td><td>{logText(r.action)}</td></tr>)}</tbody></table></div>
    {!rows.length && <p>Kayıt yok.</p>}</div>);
}

export default function Home() {
  const [st, setSt] = useState(null); const [students, setStudents] = useState([]); const [tab, setTab] = useState(null); const [tick, setTick] = useState(0); const [dutyN, setDutyN] = useState(0);
  const boot = useCallback(async () => {
    const d = await api("me"); setSt(d);
    if (d.user && !d.user.must_change) {
      setStudents((await api("students")).students);
      api("duty").then((x) => setDutyN(x.duty.length)).catch(() => {});
    }
  }, []);
  useEffect(() => { boot(); }, [boot]);
  const refresh = async () => { await boot(); setTick((t) => t + 1); };
  if (!st) return <Loader />;
  if (!st.user) return <Gate setup={st.setup} onDone={boot} />;
  if (st.user.must_change) return <ChangePw onDone={boot} />;
  const me = st.user; const n = students.length; const lv = students.filter((s) => s.on_leave).length;
  const tabs = me.role === "bel"
    ? [["yoklama", `📋 Etüt & Yat Yoklaması (${n})`], ["defter", `📖 Nöbet Defteri & PDF Çıktı (${dutyN})`], ["izin", `🟡 İzinli Öğrenci Listesi (${lv})`]]
    : [["ogr", `🎓 Öğrenciler (${n})`], ["bel", "🧑‍🏫 Belletmenler"], ["yoklama", "📋 Yoklama"], ["defter", `📖 Nöbet Defteri (${dutyN})`], ["izin", `🟡 İzinler (${lv})`], ["log", "📋 Loglar"]];
  const cur = tabs.some((t) => t[0] === tab) ? tab : tabs[0][0];
  const title = me.role === "yon" ? "İDARE PANELİ" : me.scope === "K" ? "KIZ PANSİYONU NÖBET EKRANI" : "ERKEK PANSİYONU NÖBET EKRANI";
  return (<div className="gate">
    <header className="ph noprint"><div className="pl"><Logo s={46} /><div><small>{title}</small><b>{me.full_name}</b></div></div>
      <div className="pr"><button className="btn ghost sm" onClick={refresh}>🔄 Listeyi Yenile</button>
        <button className="btn red sm" onClick={async () => { await api("logout", {}); boot(); }}>Çıkış</button></div></header>
    <main className="wrap">
      <nav className="pills noprint">{tabs.map(([k, l]) => <button key={k} className={"pill" + (k === cur ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</nav>
      {cur === "yoklama" && <Attendance students={students} tick={tick} />}
      {cur === "ogr" && <Students students={students} reload={refresh} />}
      {cur === "bel" && <Teachers />}
      {cur === "defter" && <Duty me={me} onCount={setDutyN} />}
      {cur === "izin" && <Leaves students={students} />}
      {cur === "log" && <Logs />}
    </main><Footer /></div>);
}
