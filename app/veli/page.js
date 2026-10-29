"use client";
import { useEffect, useState } from "react";

async function api(path, body) {
  const r = await fetch("/api/" + path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Bir hata oluştu");
  return d;
}
const fmt = (d) => new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });

export default function Veli() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [data, setData] = useState({ students: [], leaves: [] });
  const [f, setF] = useState({ kind: "Hafta sonu" });
  const [msg, setMsg] = useState(null);
  const run = async (fn, ok) => { setMsg(null); try { await fn(); if (ok) setMsg({ ok }); } catch (e) { setMsg({ err: e.message }); } };
  const load = async () => { setData(await api("veli/ben")); setStep("izin"); };
  useEffect(() => { api("veli/ben").then((d) => { setData(d); setStep("izin"); }).catch(() => {}); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const box = msg && <div className={msg.err ? "err" : "ok"} role="alert">{msg.err || msg.ok}</div>;

  return (
    <div className="gate">
      <header className="hero">
        <img src="/logo.png" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/logo.svg"; }} alt="Okul logosu" width="72" height="72" />
        <h1>Veli İzin Talebi</h1>
        <p>Prof. Dr. Necmettin Erbakan Fen Lisesi Pansiyonu</p>
      </header>
      <div className="auth" style={{ maxWidth: 460 }}>
        {step === "phone" && (
          <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("veli/kod", { phone }); setStep("code"); }); }}>
            <h3>Cep telefonunuzu yazın</h3>
            <p className="hint">Okula kayıtlı numaranız ise WhatsApp ile 6 haneli bir kod göndereceğiz.</p>
            <label>Cep telefonu</label>
            <input inputMode="tel" placeholder="05XX XXX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            {box}
            <button className="btn" style={{ width: "100%" }}>Kod gönder</button>
          </form>
        )}
        {step === "code" && (
          <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("veli/dogrula", { phone, code }); await load(); }); }}>
            <h3>WhatsApp kodunu girin</h3>
            <p className="hint">Numara kayıtlıysa kod birkaç saniye içinde gelir. Kod 5 dakika geçerlidir.</p>
            <label>6 haneli kod</label>
            <input inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required />
            {box}
            <button className="btn" style={{ width: "100%" }}>Doğrula</button>
            <button type="button" className="btn ghost" style={{ width: "100%" }} onClick={() => { setStep("phone"); setMsg(null); }}>Numarayı değiştir</button>
          </form>
        )}
        {step === "izin" && (
          <>
            {data.students.map((s) => <div className="card" key={s.id}><b>{s.full_name}</b><br />Oda {s.room} · {s.bed}. yatak</div>)}
            <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("veli/izin", f); await load(); }, "İzin talebiniz kaydedildi."); }}>
              <h3>Yeni izin talebi</h3>
              <label>Öğrenci</label>
              <select required defaultValue="" onChange={set("student_id")}>
                <option value="" disabled>Seçin</option>
                {data.students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              <label>Tür</label>
              <select value={f.kind} onChange={set("kind")}><option>Hafta sonu</option><option>Hastalık</option><option>Özel durum</option></select>
              <label>Çıkış</label><input type="datetime-local" required onChange={set("starts_at")} />
              <label>Dönüş</label><input type="datetime-local" required onChange={set("ends_at")} />
              <label>Açıklama (isteğe bağlı)</label><input onChange={set("reason")} />
              {box}
              <button className="btn" style={{ width: "100%" }}>Talebi gönder</button>
            </form>
            {data.leaves.length > 0 && (
              <div className="card"><h3>Son izinler</h3>
                {data.leaves.map((l) => <div className="stu" key={l.id}><div className="n">{l.full_name}<small>{l.kind} · {fmt(l.starts_at)} – {fmt(l.ends_at)}</small></div></div>)}
              </div>
            )}
            <button className="btn ghost" style={{ width: "100%" }} onClick={async () => { await api("veli/cikis", {}); setStep("phone"); setCode(""); }}>Çıkış</button>
          </>
        )}
      </div>
      <footer className="foot">KVKK uyumludur · Tüm hakları saklıdır.</footer>
    </div>
  );
}

