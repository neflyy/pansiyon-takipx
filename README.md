# Prof. Dr. Necmettin Erbakan Fen Lisesi - Pansiyon ve Yurt Bilgi Sistemi

Bu proje, **Prof. Dr. Necmettin Erbakan Fen Lisesi** pansiyon süreçlerini (veli izni, WhatsApp OTP girişi, belletmen yoklama, cinsiyet bazlı öğrenci izolasyonu ve yönetici paneli) otomatikleştiren Next.js 15 projesidir.

## 🚀 Hızlı Kurulum

1. ZIP dosyasını klasöre çıkartın:
2. Terminalde proje klasörüne girin ve bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `.env.example` dosyasının adını `.env` olarak değiştirin ve kendi veritabanı (Neon PostgreSQL) ve WhatsApp API anahtarlarınızı girin:
   ```env
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="cok_gizli_jwt_anahtariniz_12345"
   WHATSAPP_API_KEY="whatsapp_api_anahtariniz"
   ```
4. Veritabanını hazırlamak için `database/schema.sql` dosyasındaki SQL sorgularını Neon PostgreSQL SQL Editor alanında çalıştırın.
5. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
6. Tarayıcınızda `http://localhost:3000` adresine gidin.

## 🎨 Tasarım ve Özellikler
- **Renk Teması:** Modern Mavi - Beyaz (`bg-gradient-to-br from-blue-50 to-white`, `bg-blue-700`).
- **Kurumsal İdentite:** Okul amblemi, "Prof. Dr. Necmettin Erbakan Fen Lisesi Pansiyon ve Yurt Bilgi Sistemi" başlığı.
- **Güvenlik & Yasal:** En altta "Bu sistem KVKK uyumludur. Tüm hakları saklıdır. © 2026" uyarısı.
- **Veli Girişi:** Şifresiz, sadece telefon numarası + WhatsApp 6 haneli OTP kodu ile.
- **Belletmen Yetkilendirmesi:** Kız belletmeni sadece Kız öğrencileri, Erkek belletmeni sadece Erkek öğrencileri görür. 107, 207, 307 numaralı odalar depo/idari alan olarak otomatik filtrelenir.
- **İdare:** Tüm kız ve erkek öğrencileri, odaları ve yoklamaları yönetebilir. Excel ile toplu öğrenci yükleme desteği barındırır.
