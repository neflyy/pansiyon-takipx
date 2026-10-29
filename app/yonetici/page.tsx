'use client';

import { useState, ChangeEvent } from 'react';
import { 
  Users, 
  Home, 
  UserCheck, 
  UserX, 
  FileSpreadsheet, 
  ShieldCheck, 
  Search, 
  Plus, 
  Trash2, 
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  gender: 'KIZ' | 'ERKEK';
  roomNumber: string;
  bedNumber: string;
  motherPhone: string;
  fatherPhone: string;
  status: 'YURTTA' | 'IZINLI' | 'REVIRDE';
}

export default function YoneticiPage() {
  const [activeTab, setActiveTab] = useState<'genel' | 'ogrenciler' | 'excel'>('genel');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'TUMU' | 'KIZ' | 'ERKEK'>('TUMU');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Örnek Öğrenci Verileri
  const [students] = useState<Student[]>([
    { id: 1, firstName: 'Ahmet', lastName: 'Yılmaz', gender: 'ERKEK', roomNumber: '101', bedNumber: '1', motherPhone: '05321112233', fatherPhone: '05321112234', status: 'YURTTA' },
    { id: 2, firstName: 'Zeynep', lastName: 'Kaya', gender: 'KIZ', roomNumber: '201', bedNumber: '2', motherPhone: '05332223344', fatherPhone: '05332223345', status: 'IZINLI' },
    { id: 3, firstName: 'Mehmet', lastName: 'Demir', gender: 'ERKEK', roomNumber: '102', bedNumber: '1', motherPhone: '05343334455', fatherPhone: '05343334456', status: 'YURTTA' },
    { id: 4, firstName: 'Elif', lastName: 'Çelik', gender: 'KIZ', roomNumber: '202', bedNumber: '3', motherPhone: '05354445566', fatherPhone: '05354445567', status: 'YURTTA' },
  ]);

  // Excel Yükleme İşleyicisi
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadStatus('Lütfen sadece .xlsx veya .xls formatında Excel dosyası seçiniz.');
      return;
    }

    setUploadStatus(`${file.name} dosyası okundu. Öğrenciler veritabanına aktarılıyor...`);
    setTimeout(() => {
      setUploadStatus('Toplu öğrenci ve veli kaydı başarıyla tamamlandı!');
    }, 1200);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = `${s.firstName} ${s.lastName} ${s.roomNumber}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = selectedGenderFilter === 'TUMU' || s.gender === selectedGenderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Üst Header / Başlık */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 bg-white text-blue-900 rounded-2xl flex items-center justify-center font-black text-xl shadow-md border-2 border-blue-200 shrink-0">
              NEFL
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Prof. Dr. Necmettin Erbakan Fen Lisesi</h1>
              <p className="text-blue-200 text-xs sm:text-sm font-medium">Pansiyon Yönetici & İdare Kontrol Paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-950/60 backdrop-blur px-4 py-2 rounded-xl border border-blue-700/50 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sistem Yöneticisi Yetkisi</span>
          </div>
        </div>
      </header>

      {/* Navigasyon Sekmeleri */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('genel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'genel' ? 'bg-blue-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" /> Genel Bakış & Durum
          </button>
          <button
            onClick={() => setActiveTab('ogrenciler')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'ogrenciler' ? 'bg-blue-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" /> Öğrenci & Oda Kütüğü
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'excel' ? 'bg-blue-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel Toplu Yükleme
          </button>
        </div>
      </div>

      {/* İçerik Alanı */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* SEKME 1: GENEL BAKIŞ */}
        {activeTab === 'genel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toplam Öğrenci</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{students.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pansiyonda (Yurtta)</p>
                  <p className="text-3xl font-black text-emerald-700 mt-1">
                    {students.filter(s => s.status === 'YURTTA').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">İzinli Öğrenci</p>
                  <p className="text-3xl font-black text-amber-600 mt-1">
                    {students.filter(s => s.status === 'IZINLI').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <UserX className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kız / Erkek Dağılımı</p>
                  <p className="text-base font-extrabold text-slate-800 mt-1">
                    {students.filter(s => s.gender === 'KIZ').length} Kız / {students.filter(s => s.gender === 'ERKEK').length} Erkek
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Pansiyon Kat & Blok Doluluk Durumu</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="font-bold text-sm text-slate-700">1. Kat Erkek Pansiyonu (101-115)</p>
                  <p className="text-xs text-slate-500 mt-1">107 numaralı oda depo/idari alandır.</p>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-blue-600 h-full w-[75%]"></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="font-bold text-sm text-slate-700">2. Kat Kız Pansiyonu (201-215)</p>
                  <p className="text-xs text-slate-500 mt-1">207 numaralı oda depo/idari alandır.</p>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-pink-500 h-full w-[80%]"></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="font-bold text-sm text-slate-700">3. Kat Karma Ek Blok (301-315)</p>
                  <p className="text-xs text-slate-500 mt-1">307 numaralı oda depo/idari alandır.</p>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-purple-600 h-full w-[50%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEKME 2: ÖĞRENCİ KÜTÜĞÜ */}
        {activeTab === 'ogrenciler' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="İsim, soyisim veya oda no ile ara..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  value={selectedGenderFilter}
                  onChange={(e) => setSelectedGenderFilter(e.target.value as any)}
                >
                  <option value="TUMU">Tüm Cinsiyetler</option>
                  <option value="KIZ">Sadece Kız</option>
                  <option value="ERKEK">Sadece Erkek</option>
                </select>

                <button className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow shrink-0">
                  <Plus className="w-4 h-4" /> Yeni Öğrenci
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Öğrenci Ad Soyad</th>
                    <th className="p-4">Cinsiyet</th>
                    <th className="p-4">Oda / Yatak</th>
                    <th className="p-4">Anne Tel</th>
                    <th className="p-4">Baba Tel</th>
                    <th className="p-4">Anlık Durum</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{s.firstName} {s.lastName}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] ${
                            s.gender === 'KIZ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {s.gender}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">Oda {s.roomNumber} (Yatak {s.bedNumber})</td>
                        <td className="p-4 text-slate-600 font-mono">{s.motherPhone}</td>
                        <td className="p-4 text-slate-600 font-mono">{s.fatherPhone}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] ${
                            s.status === 'YURTTA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors" title="Şifre/İzin Sıfırla">
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors" title="Sil">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        Kayıtlı öğrenci bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEKME 3: EXCEL TOPLU YÜKLEME */}
        {activeTab === 'excel' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">e-Okul Toplu Öğrenci & Veli Aktarımı</h3>
              <p className="text-xs text-slate-500 mt-1">
                Hazırladığınız Excel (.xlsx, .xls) dosyasını seçerek tüm öğrencileri ve veli telefonlarını tek tıkla sisteme aktarabilirsiniz.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Excel Dosyasını Sürükleyin veya Tıklayın</p>
              <p className="text-[10px] text-slate-400 mt-1">Desteklenen Formatlar: .xlsx, .xls</p>
            </div>

            {uploadStatus && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs font-semibold text-blue-900">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span>{uploadStatus}</span>
              </div>
            )}

            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Şablon Gereksinimleri:
              </p>
              <p>• Excel dosyanızdaki sütunlar: <strong>Ad, Soyad, Cinsiyet, OdaNo, YatakNo, AnneTel, BabaTel</strong> şeklinde olmalıdır.</p>
              <p>• Yükleme sonrası veli telefonlarına otomatik erişim tanımlanır.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
