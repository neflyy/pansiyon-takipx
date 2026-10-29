-- Prof. Dr. Necmettin Erbakan Fen Lisesi Pansiyon Veritabanı Şeması

-- 1. Kullanıcılar ve Roller (İdare, Belletmen Öğretmenler)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'IDARE', 'BELLETMEN_KIZ', 'BELLETMEN_ERKEK'
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Veliler (Sadece Telefon Numarası ile WhatsApp OTP Girişi)
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    whatsapp_otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Öğrenciler (Kız/Erkek Oda ve Veli İlişkileri)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL, -- 'KIZ' veya 'ERKEK'
    room_number VARCHAR(10) NOT NULL, -- 101..115, 201..215, 301..315 (107, 207, 307 depo)
    bed_number VARCHAR(5),
    mother_phone VARCHAR(15),
    father_phone VARCHAR(15),
    parent_id INT REFERENCES parents(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. İzin Talepleri
CREATE TABLE IF NOT EXISTS leaves (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    leave_type VARCHAR(20) NOT NULL, -- 'EV_IZNI', 'ETUT_IZNI'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    destination_address TEXT,
    transport_mode VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ONAYLANDI', -- MEB mevzuatı gereği otomatik onaylı
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Yoklama Kayıtları
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    session_type VARCHAR(20) NOT NULL, -- 'ETUT' (19:15), 'YAT' (23:00)
    status VARCHAR(20) NOT NULL, -- 'VAR', 'YOK', 'GEC', 'IZINLI'
    recorded_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Varsayılan Örnek Test Kullanıcıları (Şifreler: 123456)
INSERT INTO users (full_name, phone, role, password_hash) 
VALUES 
('Okul Müdürü / İdare', '05001112233', 'IDARE', '123456'),
('Kız Pansiyon Belletmeni', '05002223344', 'BELLETMEN_KIZ', '123456'),
('Erkek Pansiyon Belletmeni', '05003334455', 'BELLETMEN_ERKEK', '123456')
ON CONFLICT (phone) DO NOTHING;
