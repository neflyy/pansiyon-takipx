"use client";
import { useEffect, useState } from 'react';
const api = async (p, b) => { const r = await fetch('/api/' + p, { cache: 'no-store', credentials: 'same-origin', method: b ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Hata'); return d; };
const ST = { yurtta: 'Yurtta', izinli: 'İzinli', etutte: 'Etütte', revir: 'Revirde' }, SS = { etut: 'Etüt (19:15)', yat: 'Yat (23:00)' };
const wa = (s, ses, v) => `https://wa.me/90${(s.phone || '').replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Sayın veli, öğrencimiz ${s.full_name} bugünkü ${ses === 'etut' ? 'etüt' : 'yat'} yoklamasında ${v === 'yok' ? 'mazeretsiz olarak bulunamamıştır' : 'geç kalmıştır'}. Lütfen bilgi veriniz.`)}`;
const fd = (e) => Object.fromEntries(new FormData(e.target));

export default function Page() {
  const [boot, setBoot] = useState(null), [d, setD] = useState(null), [tab, setTab] = useState(''), [err, setErr] = useState(''), [info, setInfo] = useState(null), [ses, setSes] = useState('etut'), [mk, setMk] = useState({}), [reqs, setReqs] = useState([]), [code, setCode] = useState(null), [showPw, setShowPw] = useState(false), [busy, setBusy] = useState(false);
  const load = async () => { const b = await api('boot'); setBoot(b); if (b.me && !b.me.must_change) { setD(await api('data')); setTab((t) => t || { veli: 'durum', bel: 'yoklama', yon: 'panel' }[b.me.role]); } };
  const run = async (f) => { setErr(''); try { await f(); } catch (e) { setErr(e.message); } };
  useEffect(() => { run(load); }, []);
  useEffect(() => {
    if (!boot?.me) return; let t; const ev = ['click', 'keydown', 'touchstart'];
    const r = () => { clearTimeout(t); t = setTimeout(async () => { await api('logout', {}); location.reload(); }, 900000); };
    r(); ev.forEach((e) => addEventListener(e, r)); return () => { clearTimeout(t); ev.forEach((e) => removeEventListener(e, r)); };
  }, [boot?.me?.id]);
  useEffect(() => {
    const r = boot?.me?.role; if (!(r === 'bel' || r === 'yon') || boot.me.must_change) return;
    let on = true; const tick = async () => { try { const x = await api('requests'); if (on) setReqs(x.items); } catch {} };
    tick(); const i = setInterval(tick, 8000); return () => { on = false; clearInterval(i); };
  }, [boot?.me?.id, boot?.me?.must_change]);
  useEffect(() => { document.title = (reqs.length ? `(${reqs.length}) ` : '') + 'Pansiyon Takip'; }, [reqs.length]);
  if (!boot) return <p className="w">{err || 'Yükleniyor…'}</p>;
  const m = boot.me, out = () => run(async () => { await api('logout', {}); location.reload(); });
  const send = (p, body, after) => run(async () => { const r = await api(p, body); if (after) after(r); setD(await api('data')); });
  const Err = () => err ? <p className="err">{err}</p> : null;

  if (!m) return (
    <div className="lg">
      <aside className="lg-side">
        <div className="lg-brand"><span className="lg-logo">🏫</span><b>Pansiyon Takip</b></div>
        <h2>Pansiyon yönetimi, tek ekranda.</h2>
        <p>Yoklama, izin ve nöbet işlemleri; hızlı, güvenli ve her cihazda.</p>
        <ul><li>Anlık yoklama ve izin takibi</li><li>Velilere WhatsApp bilgilendirme</li><li>Güvenli oturum ve denetim kaydı</li></ul>
      </aside>
      <main className="lg-main">
        <form className="lg-card" onSubmit={(e) => { e.preventDefault(); const f = fd(e); setBusy(true); run(async () => { try { await api(boot.setup ? 'setup' : 'login', f); await load(); } finally { setBusy(false); } }); }}>
          <h1>{boot.setup ? 'İlk Kurulum' : 'Hoş geldiniz'}</h1>
          <p className="lg-sub">{boot.setup ? 'Yönetici hesabını oluşturun.' : 'Hesabınıza giriş yapın.'}</p>
          {boot.setup && <><label>Ad Soyad</label><input name="full_name" required maxLength={60} placeholder="Adınız Soyadınız" /></>}
          <label>{boot.setup ? 'Kullanıcı adı (3-30 harf/rakam)' : 'T.C. No, kullanıcı adı veya telefon'}</label>
          <input name={boot.setup ? 'username' : 'ident'} required autoComplete="username" placeholder={boot.setup ? 'kullanici.adi' : 'T.C. No / kullanıcı adı'} />
          <label>Şifre{boot.setup ? ' (en az 8, harf ve rakam)' : ''}</label>
          <div className="lg-pw"><input name="password" type={showPw ? 'text' : 'password'} required autoComplete={boot.setup ? 'new-password' : 'current-password'} placeholder="••••••••" /><button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? 'Gizle' : 'Göster'}</button></div>
          <Err />
          <button className="lg-btn" disabled={busy}>{busy ? 'Lütfen bekleyin…' : boot.setup ? 'Kurulumu Tamamla' : 'Giriş Yap'}</button>
          {!boot.setup && <><div className="lg-or"><span>veya</span></div><a className="lg-alt" href="/izin">Veli: izin talebi (giriş gerekmez)</a></>}
        </form>
        <p className="lg-foot">Pansiyon ve Yurt Takip Sistemi</p>
      </main>
    </div>);

  if (m.must_change || tab === 'pw') return (
    <form className="card auth" onSubmit={(e) => { e.preventDefault(); run(async () => { await api('password', fd(e)); setTab(''); await load(); }); }}>
      <h2>{m.must_change ? 'Geçici şifrenizi değiştirin' : 'Şifre değiştir'}</h2>
      <label>Yeni şifre (en az 8, harf ve rakam)</label><input name="password" type="password" required autoComplete="new-password" /><Err />
      <p><button className="p">Kaydet</button> <button type="button" onClick={m.must_change ? out : () => setTab('')}>{m.must_change ? 'Çıkış' : 'Vazgeç'}</button></p>
    </form>);

  if (!d) return <p className="w">Yükleniyor…</p>;
  const tabs = { veli: [['durum', 'Öğrencilerim'], ['izin', 'İzin Bildir'], ['gecmis', 'Geçmiş']], bel: [['yoklama', 'Yoklama']], yon: [['panel', 'Panel'], ['ogr', 'Öğrenciler'], ['kul', 'Kullanıcılar'], ['log', 'Denetim']] }[m.role];
  const cnt = (s) => d.students.filter((x) => x.status === s).length;
  const state = (s) => s.status === 'izinli' ? 'izinli' : (mk[ses + s.id] ?? d.att.find((a) => a.student_id === s.id && a.session === ses)?.state);
  const badge = (s) => <b>{ST[s]}</b>;

  return (
    <div className="w">
      <div className="row"><h2>🏫 {{ veli: 'Veli', bel: 'Nöbetçi Belletmen', yon: 'Yönetici' }[m.role]}</h2><span className="mu">{m.full_name} <button onClick={() => setTab('pw')}>🔑</button> <button onClick={out}>Çıkış</button></span></div>
      <div className="tabs">{tabs.map(([k, v]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{v}</button>)}</div>
      <Err />
      {(m.role === 'bel' || m.role === 'yon') && reqs.length > 0 && <div className="card" style={{ borderColor: '#e0900b' }}><b>🔔 {reqs.length} izin talebi bekliyor</b>
        {reqs.map((q) => <div className="row" key={q.id}><span><b>{q.full_name}</b> · {q.sinif}/{q.okul_no} · Oda {q.room}<div className="mu">{q.kind} · {new Date(q.starts_at).toLocaleString('tr-TR')} → {new Date(q.ends_at).toLocaleString('tr-TR')}{q.reason ? ' · ' + q.reason : ''}{q.status === 'kod_gonderildi' ? ' · kod üretildi' : ''}</div></span>
          <span><button className="p" onClick={() => run(async () => { setCode(await api('requests/approve', { id: q.id })); setReqs((await api('requests')).items); })}>{q.status === 'kod_gonderildi' ? 'Yeni Kod' : 'Onayla (Kod Üret)'}</button> <button className="d" onClick={() => run(async () => { await api('requests/reject', { id: q.id }); setReqs((await api('requests')).items); })}>Reddet</button></span></div>)}</div>}
      {code && <div className="card"><b>{code.name} için onay kodu</b><div style={{ fontSize: 32, letterSpacing: 6 }}>{code.code}</div><p className="mu">{code.ttl} dk geçerli. WhatsApp düğmesi mesajı velinin numarasına hazır açar; göndermeyi siz onaylarsınız.</p>
        <a className="btn" href={`https://wa.me/90${code.phone.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Sayın veli, ${code.name} için ${code.kind} talebi var (${new Date(code.starts_at).toLocaleString('tr-TR')} - ${new Date(code.ends_at).toLocaleString('tr-TR')}).\nOnay kodunuz: ${code.code}\nBu talebi siz yapmadıysanız kodu kimseyle paylaşmayın ve okulu arayın. Kod ${code.ttl} dakika geçerlidir.`)}`} target="_blank" rel="noopener noreferrer">WhatsApp ile Gönder</a> <button onClick={() => setCode(null)}>Kapat</button></div>}
      {info && <div className="card"><b>{info.t}</b><pre style={{ whiteSpace: 'pre-wrap' }}>{info.b}</pre><p className="mu">Yalnızca şimdi gösterilir; ilk girişte değiştirilecek.</p><button onClick={() => setInfo(null)}>Kapat</button></div>}

      {tab === 'durum' && (d.students.length ? d.students.map((s) => <div className="card row" key={s.id}><div><b>{s.full_name}</b><div className="mu">Oda {s.room} · Yatak {s.bed}</div></div><div>{badge(s.status)} {s.status === 'izinli' && <button onClick={() => send('leave/end', { student_id: s.id })}>İzni Bitir</button>}</div></div>) : <div className="card">Kayıtlı öğrenci yok.</div>)}
      {tab === 'izin' && <div className="card"><h3>İzin talebi</h3><p>Güvenlik için izin talebi <a href="/izin"><b>/izin</b></a> sayfasından yapılır: öğrencinin sınıfı ve okul numarası girilir, kayıtlı telefonunuza WhatsApp ile gelen kod girilince izin onaylanır.</p></div>}
      {tab === 'gecmis' && <div className="card">{d.att.map((a, i) => <div className="row" key={i}><span>{a.day} · {a.session === 'etut' ? 'Etüt' : 'Yat'} · {d.students.find((s) => s.id === a.student_id)?.full_name}</span><b>{a.state}</b></div>)}{!d.att.length && 'Kayıt yok.'}</div>}

      {tab === 'yoklama' && <div className="card"><div className="tabs">{Object.entries(SS).map(([k, v]) => <button key={k} className={ses === k ? 'on' : ''} onClick={() => { setSes(k); setMk({}); }}>{v}</button>)}</div>
        <button onClick={() => setMk(Object.fromEntries(d.students.filter((s) => s.status !== 'izinli').map((s) => [ses + s.id, 'var'])))}>Tümünü Var Yap</button> <button className="p" onClick={() => send('attendance', { session: ses, marks: Object.fromEntries(d.students.map((s) => [s.id, state(s)])) }, () => setMk({}))}>Kaydet</button>
        {d.students.map((s) => { const v = state(s); return <div className="row" key={s.id}><span><b>{s.full_name}</b> <span className="mu">{s.room}</span></span>
          <span>{s.status === 'izinli' ? '🔒 İzinli' : [['var', 'Var', 'v'], ['yok', 'Yok', 'y'], ['gec', 'Geç', 'gc']].map(([k, l, c]) => <button key={k} className={`${c} ${v === k ? 'on' : ''}`} onClick={() => setMk({ ...mk, [ses + s.id]: k })}>{l}</button>)}
            {(v === 'yok' || v === 'gec') && <> <a href={wa(s, ses, v)} target="_blank" rel="noopener noreferrer">WhatsApp</a></>}</span></div>; })}</div>}

      {tab === 'panel' && <><div className="g">{[['Toplam', d.students.length], ['Yurtta', cnt('yurtta')], ['İzinli', cnt('izinli')], ['Revirde', cnt('revir')]].map(([k, v]) => <div className="card" key={k}><b>{v}</b><span className="mu">{k}</span></div>)}</div>
        <div className="card"><h3>Bugünkü yoklama</h3>{['etut', 'yat'].map((k) => <div className="row" key={k}>{SS[k]}<span>{d.att.filter((a) => a.session === k && a.state === 'yok').length} yok · {d.att.filter((a) => a.session === k && a.state === 'gec').length} geç</span></div>)}</div></>}
      {tab === 'ogr' && <><form className="card" onSubmit={(e) => { e.preventDefault(); const rows = fd(e).rows.split('\n').map((l) => l.split(';').map((x) => x.trim())).filter((r) => r.length >= 7); send('students/bulk', { rows }, (r) => setInfo({ t: r.added + ' öğrenci eklendi', b: r.temps.map((x) => x.tc + ' → ' + x.pw).join('\n') || 'Yeni hesap yok' })); e.target.reset(); }}>
        <h3>Toplu Aktarım</h3><p className="mu">Her satır: Ad Soyad;Oda;Yatak;Veli T.C.;Telefon;Sınıf;Okul No (107/207/307 kabul edilmez). Sınıf ve okul no, velinin giriş yapmadan izin istemesi için gereklidir.</p><textarea name="rows" rows={4} required /><p><button className="p">İçe Aktar</button></p></form>
        <div className="card">{d.students.map((s) => <div className="row" key={s.id}><span>{s.full_name} · {s.sinif || '?'}/{s.okul_no || '?'} · {s.room}/{s.bed} · {badge(s.status)}</span><span>
          <button onClick={() => { const sinif = prompt('Sınıf (örn. 9A):', s.sinif || ''); if (sinif) send('students/update', { id: s.id, room: s.room, bed: s.bed, sinif, okul_no: prompt('Okul no:', s.okul_no || '') || s.okul_no }); }}>Sınıf/No</button> <button onClick={() => { const room = prompt('Yeni oda:', s.room); if (room) send('students/update', { id: s.id, room, bed: prompt('Yatak (1-4):', s.bed) || s.bed }); }}>Nakil</button> <button onClick={() => send('students/update', { id: s.id, room: s.room, bed: s.bed, status: s.status === 'revir' ? 'yurtta' : 'revir' })}>Revir</button> <button className="d" onClick={() => confirm(s.full_name + ' silinsin mi?') && send('students/delete', { id: s.id })}>Sil</button></span></div>)}</div></>}
      {tab === 'kul' && <><div className="card">{d.users.map((x) => <div className="row" key={x.id}><span>{x.full_name} · {x.role} · {x.username || x.tc}</span><button onClick={() => send('users/reset', { id: x.id }, (r) => setInfo({ t: x.full_name + ' — geçici şifre', b: r.pw }))}>Şifre Sıfırla</button></div>)}</div>
        <form className="card" onSubmit={(e) => { e.preventDefault(); send('users/add', fd(e), (r) => setInfo({ t: 'Belletmen eklendi — geçici şifre', b: r.pw })); e.target.reset(); }}><h3>Belletmen Ekle</h3><label>Ad Soyad</label><input name="full_name" required maxLength={60} /><label>Kullanıcı adı</label><input name="username" required /><p><button className="p">Ekle</button></p></form></>}
      {tab === 'log' && <div className="card">{d.audit.map((a) => <div className="row" key={a.id}><span>{a.action}</span><span className="mu">{a.full_name || '-'} · {new Date(a.created_at).toLocaleString('tr-TR')}</span></div>)}</div>}
    </div>);
}
