"use client";
import { useEffect, useState } from "react";
import { api, fmt, Logo, Footer, VeliLogin, useAction } from "@/components/ui";

const AT = { var: "Yurtta", yok: "Katılmadı", gec: "Geç" };
const AC = { var: "green", yok: "orange", gec: "orange" };

export default function Veli() {
  const [data, setData] = useState(null); const [f, setF] = useState({ kind: "Hafta sonu" }); const [run, box] = useAction();
  const load = async () => setData(await api("veli/ben"));
  useEffect(() => { api("veli/ben").then(setData).catch(() => setData(false)); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="gate">
      <header className="ph"><div className="pl"><Logo s={46} /><div><small>VELİ PORTALI</small><b>Prof. Dr. Necmettin Erbakan Fen Lisesi Pansiyonu</b></div></div>
        <div className="pr">{data ? <button className="btn red sm" onClick={async () => { await api("veli/cikis", {}); setData(false); }}>Çıkış</button> : <a className="btn ghost sm" href="/">Ana sayfa</a>}</div></header>
      <main className="wrap" style={{ maxWidth: 720 }}>
        {data === null && "Yükleniyor…"}
        {data === false && (<div className="card" style={{ maxWidth: 440, margin: "6vh auto 0" }}><h2>Veli Girişi</h2><VeliLogin onDone={load} /></div>)}
        {data && (<>
          {data.students.map((s) => <div className="card" key={s.id}><h3>{s.full_name}</h3>Oda {s.room} · {s.bed}. yatak</div>)}
          <form className="card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("veli/izin", f); await load(); }, "İzin talebiniz kaydedildi."); }}>
            <h3>İzin talebi</h3>
            <label>Öğrenci</label>
            <select required defaultValue="" onChange={set("student_id")}><option value="" disabled>Seçin</option>{data.students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
            <label>Tür</label><select value={f.kind} onChange={set("kind")}><option>Hafta sonu</option><option>Hastalık</option><option>Özel durum</option></select>
            <label>Çıkış</label><input type="datetime-local" required onChange={set("starts_at")} />
            <label>Dönüş</label><input type="datetime-local" required onChange={set("ends_at")} />
            <label>Açıklama (isteğe bağlı)</label><input onChange={set("reason")} />
            {box}<button className="btn">Talebi gönder</button>
          </form>
          {data.leaves.length > 0 && (<div className="card"><h3>Son izinler</h3>
            {data.leaves.map((l) => <div className="stu" key={l.id}><div className="n">{l.full_name}<small>{l.kind} · {fmt(l.starts_at)} – {fmt(l.ends_at)}</small></div></div>)}</div>)}
          <div className="card"><h3>Yoklama geçmişi</h3>
            {data.history.length === 0 ? "Henüz yoklama kaydı yok." : (<div className="tw"><table className="tbl"><thead><tr><th>Tarih</th><th>Öğrenci</th><th>Yoklama</th><th>Durum</th></tr></thead>
              <tbody>{data.history.map((h, i) => (<tr key={i}><td>{new Date(h.day).toLocaleDateString("tr-TR")}</td><td>{h.full_name}</td><td>{h.session === "yat" ? "Yatış" : "Etüt"}</td><td><span className={"dot " + AC[h.state]}>{AT[h.state]}</span></td></tr>))}</tbody></table></div>)}
          </div>
        </>)}
      </main>
      <Footer />
    </div>
  );
}
