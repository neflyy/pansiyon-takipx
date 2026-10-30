"use client";
import { useState } from "react";

export async function api(path, body) {
  const r = await fetch("/api/" + path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Bir hata oluştu");
  return d;
}
export const todayStr = () => new Date().toLocaleDateString("sv", { timeZone: "Europe/Istanbul" });
export const fmt = (d) => new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
export const fmtPhone = (p) => (p ? `0${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6, 8)} ${p.slice(8)}` : "-");

export function Logo({ s = 56 }) {
  return <img src="/logo.png" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/logo.svg"; }} alt="Okul logosu" width={s} height={s} />;
}
export function Footer() {
  return (<footer className="foot"><span>© 2026 Prof. Dr. Necmettin Erbakan Fen Lisesi Pansiyonu yönetim sistemi</span><span>KVKK uyumludur · Tüm hakları saklıdır.</span></footer>);
}
export function useAction() {
  const [msg, setMsg] = useState(null);
  const run = async (fn, okText) => { setMsg(null); try { const r = await fn(); if (okText) setMsg({ ok: okText }); return r; } catch (e) { setMsg({ err: e.message }); } };
  const box = msg && <div className={msg.err ? "err" : "ok"} role="alert">{msg.err || msg.ok}</div>;
  return [run, box, setMsg];
}

export function VeliLogin({ onDone }) {
  const [step, setStep] = useState("phone"); const [phone, setPhone] = useState(""); const [code, setCode] = useState("");
  const [run, box, setMsg] = useAction();
  if (step === "phone") return (
    <form onSubmit={(e) => { e.preventDefault(); run(async () => { await api("veli/kod", { phone }); setStep("code"); }); }}>
      <label>Sistemde Kayıtlı Veli Cep Telefonu Numaranız</label>
      <input className="big" inputMode="tel" placeholder="05XX XXX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      {box}
      <button className="btn wa">WhatsApp İle Şifre Gönder</button>
    </form>);
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(async () => { await api("veli/dogrula", { phone, code }); await onDone(); }); }}>
      <label>WhatsApp'a gelen 6 haneli şifre</label>
      <input className="big" inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required />
      <p className="hint">Şifre 5 dakika geçerlidir.</p>
      {box}
      <button className="btn">Giriş Yap</button>
      <button type="button" className="btn ghost" onClick={() => { setStep("phone"); setMsg(null); }}>Numarayı değiştir</button>
    </form>);
}

export function Loader({ compact = false }) {
  return (
    <div className="loader" role="status" aria-label="Yükleniyor" style={compact ? { minHeight: "40vh", background: "transparent" } : undefined}>
      <svg className="hg" viewBox="0 0 60 80" width="76" height="101" aria-hidden="true">
        <rect x="8" y="3" width="44" height="7" rx="3.5" fill="#0d3b8e" />
        <rect x="8" y="70" width="44" height="7" rx="3.5" fill="#0d3b8e" />
        <path d="M14 10H46C46 24 36 32 30 40C36 48 46 56 46 70H14C14 56 24 48 30 40C24 32 14 24 14 10Z" fill="#e8f1fd" stroke="#0d3b8e" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon className="sand top" points="17,12 43,12 30,37" fill="#f2a900" />
        <polygon className="sand bot" points="16,68 44,68 30,48" fill="#f2a900" />
        <line className="stream" x1="30" y1="39" x2="30" y2="66" stroke="#f2a900" strokeWidth="2" />
      </svg>
    </div>
  );
}
