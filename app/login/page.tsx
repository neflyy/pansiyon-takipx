'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');

  // Mobil numara temizleyici (boşlukları ve gereksiz karakterleri atar)
  const cleanMobileInput = (input: string) => {
    return input.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  };

  const handleSendCode = async () => {
    const cleanedPhone = cleanMobileInput(phone);
    // API'ye istek at
    const res = await fetch('/api/auth/whatsapp-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanedPhone }),
    });

    const data = await res.json();
    if (res.ok) {
      setShowOtp(true);
      setMessage('Doğrulama kodu WhatsApp üzerinden gönderildi.');
    } else {
      setMessage(data.error || 'Bir hata oluştu.');
    }
  };

  const handleLogin = async () => {
    // Burada OTP doğrulama rotası çağrılacak
    setMessage('Giriş yapılıyor...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-700 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            NEFL
          </div>
          <h1 className="text-2xl font-bold text-blue-900 mb-2">Prof. Dr. Necmettin Erbakan Fen Lisesi</h1>
          <h2 className="text-lg text-blue-600 font-medium">Pansiyon ve Yurt Bilgi Sistemi</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sisteme Kayıtlı Telefon Numaranız</label>
            <input 
              type="tel" 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="05XX XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={showOtp}
            />
          </div>

          {!showOtp ? (
            <button 
              onClick={handleSendCode}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Giriş Kodu Gönder (WhatsApp)
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">6 Haneli Doğrulama Kodu</label>
                <input 
                  type="text" 
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-xl tracking-widest"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button 
                onClick={handleLogin}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Sisteme Giriş Yap
              </button>
            </motion.div>
          )}

          {message && (
            <p className="text-center text-sm mt-4 font-medium text-blue-800">{message}</p>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          Bu sistem KVKK uyumludur. Tüm hakları saklıdır. © 2026
        </div>
      </div>
    </div>
  );
}

