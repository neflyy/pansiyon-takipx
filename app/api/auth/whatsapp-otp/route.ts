import { NextResponse } from 'next/server';
// import db from '@/lib/db'; // Gerçek veritabanı bağlantısı buraya gelecek

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    
    // 1. Veritabanında veliyi bul (Mock Data - Örnek amaçlı)
    // const parent = await db.query('SELECT * FROM parents WHERE phone = $1', [phone]);
    const parent = { id: 1, full_name: "Örnek Veli", phone: phone }; // Dummy veri
    
    if (!parent) {
      return NextResponse.json({ error: "Sistemde kayıtlı telefon numarası bulunamadı." }, { status: 404 });
    }

    // 2. 6 Haneli OTP Üret
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60000); // 3 dakika geçerli
    
    // 3. Veritabanını Güncelle
    // await db.query('UPDATE parents SET whatsapp_otp_code = $1, otp_expires_at = $2 WHERE id = $3', [otpCode, expiresAt, parent.id]);

    // 4. WhatsApp Bot API'sine Mesajı Gönder 
    const whatsappMessage = `Sayın Velimiz (${parent.full_name}),\n\nVeli Portalı Giriş Şifreniz: *${otpCode}*\n\nGüvenliğiniz için bu kodu kimseyle paylaşmayınız.`;
    
    console.log("WhatsApp'a Gönderilecek Mesaj:", whatsappMessage);
    // await sendWhatsAppMessage(phone, whatsappMessage); // Gerçek API çağrısı

    return NextResponse.json({ success: true, message: "Onay kodu WhatsApp üzerinden gönderildi." });
  } catch (error) {
    return NextResponse.json({ error: "İşlem sırasında hata oluştu." }, { status: 500 });
  }
}

