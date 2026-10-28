# Pansiyon Takip Sistemi (Next.js 15 + Neon PostgreSQL)

1. Neon'da proje olusturun, `schema.sql` icerigini SQL Editor'de calistirin.
2. Bu klasoru Private GitHub deposuna yukleyin (.env yuklemeyin).
3. Vercel'de depoyu import edin; Environment Variables: `DATABASE_URL`, `JWT_SECRET` (en az 32 karakter).
4. Deploy sonrasi adresi acin; ilk acilista yonetici hesabini olusturun.

Yerelde: `npm install`, `.env.local` olusturun (.env.example'a bakin), `npm run dev`.
Ayrintili rehber: "Pansiyon Takip Sistemi - Ucretsiz Yayin ve Veritabani Kurulum Rehberi".

## Veli izin talebi (giris yapmadan)
Veritabaninda `migration.sql` calistirilmali. Veli `/izin` sayfasindan sinif + okul no ile talep eder; belletmen panelde kod uretip WhatsApp ile veliye gonderir.
Ogrenciler Sinif/Okul No ile kayitli olmali (toplu aktarim: Ad;Oda;Yatak;TC;Tel;Sinif;OkulNo).
