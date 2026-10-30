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
