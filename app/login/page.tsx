'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [parentName, setParentName] = useState('');

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      setMessage('Lütfen geçerli bir telefon numarası giriniz.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowOtp(true);
        setParentName(data.parentName || 'Velimiz');
        setMessage(`Sayın Velimiz (${data.parentName || 'Velimiz'}), WhatsApp hesabınıza 6 haneli doğrulama kodu gönderildi.`);
      } else {
        setMessage(data.error || 'Sistemde kayıtlı telefon numarası bulunamadı.');
      }
    } catch (err) {
      setMessage('Bağlantı hatası oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setMessage('Lütfen 6 haneli kodu eksiksiz giriniz.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Giriş başarılı! Yönlendiriliyorsunuz...');
        setTimeout(() => {
          window.location.href = data.redirectUrl || '/veli-portali';
        }, 1000);
      } else {
        setMessage(data.error || 'Girdiğiniz kod hatalı veya süresi dolmuş.');
      }
    } catch (err) {
      setMessage('Doğrulama sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex flex-col items-center justify-between p-4 sm:p-6">
      
      {/* Üst Alan / Başlık */}
      <div className="w-full max-w-lg text-center mt-6">
        <div className="w-24 h-24 bg-blue-700 text-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 border-4 border-white font-black text-3xl tracking-wider">
          NEFL
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-blue-950 tracking-tight">
          Prof. Dr. Necmettin Erbakan Fen Lisesi
        </h1>
        <h2 className="text-base sm:text-lg font-semibold text-blue-700 mt-1">
          Pansiyon ve Yurt Bilgi Sistemi
        </h2>
      </div>

      {/* Ortadaki Giriş Kartı */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-blue-100 my-auto"
      >
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Veli Giriş Portalı</h3>
          <p className="text-xs text-gray-500 mt-1">Sadece sistemde kayıtlı telefon numaranız ile giriş yapabilirsiniz.</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Sisteme Kayıtlı Telefon Numaranız
            </label>
            <input 
              type="tel" 
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-base font-medium text-gray-900 bg-gray-50/50 focus:bg-white"
              placeholder="05XX XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={showOtp || loading}
            />
          </div>

          {!showOtp ? (
            <button 
              onClick={handleSendCode}
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center text-sm"
            >
              {loading ? 'Kod Gönderiliyor...' : 'Giriş Kodu Gönder (WhatsApp)'}
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-2"
            >
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 font-medium">
                Sayın Velimiz <strong>({parentName})</strong>,<br/>
                Veli Portalı Giriş Şifreniz WhatsApp hesabınıza gönderilmiştir.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  6 Haneli WhatsApp Onay Kodu
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-center text-2xl font-mono font-bold tracking-widest text-blue-900 bg-gray-50 focus:bg-white"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button 
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
              >
                {loading ? 'Doğrulanıyor...' : 'Sisteme Giriş Yap'}
              </button>
            </motion.div>
          )}

          {message && (
            <p className={`text-center text-xs font-semibold p-3 rounded-xl ${
              showOtp ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {message}
            </p>
          )}
        </div>
      </motion.div>

      {/* Alt Bilgi / Yasal Sorumluluk Reddi */}
      <footer className="w-full text-center py-4 text-xs font-medium text-gray-500">
        Bu sistem KVKK uyumludur. Tüm hakları saklıdır. © 2026
      </footer>

    </div>
  );
}
