# Prof. Dr. Necmettin Erbakan Fen Lisesi Pansiyon ve Yurt Bilgi Sistemi

## Veritabanı
- Yeni kurulum: `schema.sql` dosyasını Neon > SQL Editor'da çalıştırın.
- Mevcut veritabanı: `migration.sql` dosyasını çalıştırın. Eski öğrenci kayıtlarında cinsiyet boş olacağından Öğrenciler sekmesinden listeyi yeniden yükleyin (eski kayıtları Neon'dan silin).

## Ortam değişkenleri (Vercel)
DATABASE_URL, JWT_SECRET (WhatsApp için Meta anahtarı gerekmez)

## WhatsApp botu (ücretsiz, sabit okul numarası)
Site, doğrulama mesajını veritabanındaki `wa_outbox` tablosuna yazar. Okuldaki bilgisayarda çalışan bot (`pansiyon-bot.zip`) tabloyu saniyeler içinde okuyup mesajı okul numarasından gönderir. Kurulum için bot klasöründeki OKU.md dosyasına bakın.

## Logo
Okul logosunu `public/logo.png` adıyla ekleyin (yoksa geçici `logo.svg` görünür).

## Roller
Yönetici tüm öğrencileri, kız bölümü belletmeni yalnızca kızları, erkek bölümü belletmeni yalnızca erkekleri görür. Veliler giriş yapmaz; `/veli` sayfasında telefon + WhatsApp kodu ile izin talep eder.
