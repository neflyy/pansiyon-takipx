# Prof. Dr. Necmettin Erbakan Fen Lisesi - Pansiyon ve Yurt Takip Sistemi

## Kurulum Adımları
1. Bu zip dosyasını bir klasöre çıkartın.
2. Terminalde proje dizinine girin ve bağımlılıkları yükleyin:
   `npm install`
3. Veritabanınızı (Neon Serverless PostgreSQL) kurun ve `database/schema.sql` dosyasındaki tabloları oluşturun.
4. `.env` dosyası oluşturarak gerekli veritabanı bağlantı (DATABASE_URL) ve WhatsApp API (WHATSAPP_API_KEY) anahtarlarınızı ekleyin.
5. Geliştirme sunucusunu başlatın:
   `npm run dev`

Sistem Next.js 15, React 19 ve TailwindCSS mimarisine uygun hazırlanmıştır.
