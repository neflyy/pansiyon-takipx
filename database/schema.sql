-- Kullanıcılar ve Roller (İdare, Belletmen)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE,
    role VARCHAR(20) NOT NULL, -- 'IDARE', 'BELLETMEN_KIZ', 'BELLETMEN_ERKEK'
    password_hash VARCHAR(255) 
);

-- Veliler (Sadece Telefon ile Giriş Yapacaklar)
CREATE TABLE parents (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL, 
    whatsapp_otp_code VARCHAR(6), 
    otp_expires_at TIMESTAMP 
);

-- Öğrenciler (Toplu kaydedilecek ana kütük)
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL, -- 'KIZ' veya 'ERKEK'
    room_number VARCHAR(10) NOT NULL,
    mother_phone VARCHAR(15),
    father_phone VARCHAR(15),
    parent_id INT REFERENCES parents(id) ON DELETE SET NULL
);

