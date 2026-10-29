'use client';

export default function YoneticiPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-8 border border-blue-100">
        <h1 className="text-2xl font-black text-blue-950 mb-2">Prof. Dr. Necmettin Erbakan Fen Lisesi</h1>
        <h2 className="text-base font-bold text-blue-600 mb-6">Pansiyon Yönetici ve İdare Paneli</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <span className="text-xs font-bold text-blue-700 uppercase">Toplam Öğrenci</span>
            <p className="text-3xl font-black text-blue-950 mt-2">180</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <span className="text-xs font-bold text-emerald-700 uppercase">Pansiyonda Olanlar</span>
            <p className="text-3xl font-black text-emerald-950 mt-2">165</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <span className="text-xs font-bold text-amber-700 uppercase">İzinli Öğrenciler</span>
            <p className="text-3xl font-black text-amber-950 mt-2">15</p>
          </div>
        </div>

        <div className="border border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50">
          <h3 className="text-sm font-bold text-slate-700 mb-2">e-Okul Toplu Öğrenci / Veli Yükleme (Excel)</h3>
          <p className="text-xs text-slate-500 mb-4">Ad, Soyad, Cinsiyet, Oda No, Anne Tel, Baba Tel sütunlarını içeren Excel dosyasını sürükleyin.</p>
          <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-3 px-6 rounded-xl shadow transition-all">
            Excel Dosyası Seç (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
}

