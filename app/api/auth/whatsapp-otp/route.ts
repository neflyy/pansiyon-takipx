import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cleanMobileInput } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const cleanedPhone = cleanMobileInput(phone);

    if (!cleanedPhone) {
      return NextResponse.json({ error: "Lütfen geçerli bir telefon numarası giriniz." }, { status: 400 });
    }

    // 1. Veritabanında veliyi sorgula
    const parents = await query('SELECT * FROM parents WHERE phone LIKE $1', [`%${cleanedPhone.slice(-10)}%`]);

    if (!parents || parents.length === 0) {
      return NextResponse.json({ 
        error: "Sistemde kayıtlı telefon numarası bulunamadı. Lütfen okul idaresi ile iletişime geçiniz." 
      }, { status: 404 });
    }

    const parent = parents[0];

    // 2. 6 Haneli OTP Üret
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60000); // 3 dakika geçerli

    // 3. Veritabanını Güncelle
    await query(
      'UPDATE parents SET whatsapp_otp_code = $1, otp_expires_at = $2 WHERE id = $3',
      [otpCode, expiresAt, parent.id]
    );

    // 4. WhatsApp Mesaj Metni
    const whatsappMessage = `Sayın Velimiz (${parent.full_name}),\n\nVeli Portalı Giriş Şifreniz: *${otpCode}*\n\nGüvenliğiniz için bu kodu kimseyle paylaşmayınız.`;

    console.log(`[WhatsApp Bot Otomasyonu - Metin Gönderildi] -> Tel: ${parent.phone} | Mesaj: ${whatsappMessage}`);

    // WhatsApp API Key varsa dış servise istek atılabilir
    if (process.env.WHATSAPP_API_KEY) {
      // Örn: Fetch Meta veya Green API
    }

    return NextResponse.json({ 
      success: true, 
      parentName: parent.full_name,
      message: "Onay kodu WhatsApp üzerinden gönderildi." 
    });

  } catch (error) {
    console.error("[WhatsApp OTP API Error]:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu. Lütfen tekrar deneyiniz." }, { status: 500 });
  }
}
