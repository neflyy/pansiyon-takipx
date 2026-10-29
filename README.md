# Prof. Dr. Necmettin Erbakan Fen Lisesi Pansiyon ve Yurt Bilgi Sistemi

## Veritabanı
- Yeni kurulum: `schema.sql` dosyasını Neon > SQL Editor'da çalıştırın.
- Mevcut veritabanı: `migration.sql` dosyasını çalıştırın. Eski öğrenci kayıtlarında cinsiyet boş olacağından Öğrenciler sekmesinden listeyi yeniden yükleyin (eski kayıtları Neon'dan silin).

## Ortam değişkenleri (Vercel > Settings > Environment Variables)
DATABASE_URL, JWT_SECRET, WA_PHONE_ID, WA_TOKEN, WA_TEMPLATE

## WhatsApp onay kodu (Meta WhatsApp Business Cloud API)
1. developers.facebook.com'da uygulama açın, WhatsApp ürününü ekleyin; okul numarasını (WhatsApp'ta kayıtlı olmayan) ekleyin.
2. Telefon numarası ID'si → `WA_PHONE_ID`, kalıcı erişim anahtarı (System User token) → `WA_TOKEN`.
3. Mesaj şablonu oluşturun (dil: Türkçe, ad: `veli_giris_kodu` → `WA_TEMPLATE`):
```
Sayın Velimiz ({{1}}),
Veli Portalı Giriş Şifreniz: {{2}}
Güvenliğiniz için bu kodu kimseyle paylaşmayınız.
```
   {{1}} veli adı, {{2}} 6 haneli koddur. Meta bu metni "Doğrulama" yerine "Yardımcı (Utility)" kategorisinde değerlendirebilir veya standart doğrulama biçimini isteyebilir; onay sonucuna göre kodu birlikte uyarlarız.

## Logo
Okul logosunu `public/logo.png` adıyla ekleyin (yoksa geçici `logo.svg` görünür).

## Roller
Yönetici tüm öğrencileri, kız bölümü belletmeni yalnızca kızları, erkek bölümü belletmeni yalnızca erkekleri görür. Veliler giriş yapmaz; `/veli` sayfasında telefon + WhatsApp kodu ile izin talep eder.
