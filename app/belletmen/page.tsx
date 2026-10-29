'use client';

import { useState } from 'react';

export default function BelletmenPortalPage() {
  const [activeTab, setActiveTab] = useState<'KIZ' | 'ERKEK'>('KIZ');

  // 107, 207, 307 numaralı odalar depo/idari alan olduğu için filtrelenir
  const validRooms = [
    '101', '102', '103', '104', '105', '106', '108', '109', '110', '111', '112', '113', '114', '115',
    '201', '202', '203', '204', '205', '206', '208', '209', '210', '211', '212', '213', '214', '215',
    '301', '302', '303', '304', '305', '306', '308', '309', '310', '311', '312', '313', '314', '315'
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <header className="max-w-7xl mx-auto bg-white rounded-2xl p-6 shadow-md mb-6 border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-blue-900">Prof. Dr. Necmettin Erbakan Fen Lisesi</h1>
          <h2 className="text-sm font-semibold text-blue-600">Nöbetçi Belletmen Öğretmen Portalı</h2>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('KIZ')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'KIZ' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Kız Pansiyonu Odaları
          </button>
          <button 
            onClick={() => setActiveTab('ERKEK')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'ERKEK' ? 'bg-blue-700 text-white shadow-md' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Erkek Pansiyonu Odaları
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {activeTab === 'KIZ' ? 'Kız Öğrenci Kat Planı & Yoklama' : 'Erkek Öğrenci Kat Planı & Yoklama'}
            </h3>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              Not: 107, 207 ve 307 numaralı odalar depo/idari alan olup listeden düşülmüştür.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {validRooms.map((room) => (
              <div key={room} className="border border-slate-200 rounded-xl p-3 text-center hover:border-blue-500 cursor-pointer transition-all bg-slate-50 hover:bg-blue-50">
                <span className="text-xs text-slate-400 block font-bold">Oda</span>
                <span className="text-lg font-black text-slate-800">{room}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

