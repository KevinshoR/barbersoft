-- Tabla de barberías (cada cliente que paga es una barbería)
CREATE TABLE barbershops (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  address     VARCHAR(200),
  slug        VARCHAR(100) UNIQUE NOT NULL, -- URL pública: /reservar/mi-barberia
  department   VARCHAR(100), -- departamento de Colombia (ver frontend/src/data/colombia.json)
  municipality VARCHAR(100), -- municipio del departamento elegido
  -- Suscripción
  subscription_status  VARCHAR(20) DEFAULT 'trial', -- trial | active | blocked
  trial_ends_at        TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_ends_at TIMESTAMP,
  -- Sistema de referidos
  referral_code         VARCHAR(12) UNIQUE, -- código propio de esta barbería para referir a otras
  referred_by            VARCHAR(12),        -- referral_code de quien la refirió al registrarse (null si ninguno)
  referral_bonus_given   BOOLEAN DEFAULT false, -- true una vez que se dio el beneficio de 15 días por SU primer pago
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Migración para bases ya existentes (la tabla barbershops ya tenía datos):
-- ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS department VARCHAR(100), ADD COLUMN IF NOT EXISTS municipality VARCHAR(100);
-- ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE, ADD COLUMN IF NOT EXISTS referred_by VARCHAR(12), ADD COLUMN IF NOT EXISTS referral_bonus_given BOOLEAN DEFAULT false;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_barbershops_referral_code ON barbershops(referral_code);

-- Tabla de barberos (empleados del local)
CREATE TABLE barbers (
  id             SERIAL PRIMARY KEY,
  barbershop_id  INT REFERENCES barbershops(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  photo_url      VARCHAR(255),
  specialty      VARCHAR(120),        -- especialidad del barbero (ej: "Cortes clásicos")
  work_days      VARCHAR(20) DEFAULT '1,2,3,4,5,6', -- días 0-6 (Date.getDay()) separados por coma; default Lun-Sáb
  active         BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Migración para bases ya existentes (la tabla barbers ya tenía datos):
-- ALTER TABLE barbers ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255), ADD COLUMN IF NOT EXISTS specialty VARCHAR(120);
-- ALTER TABLE barbers ADD COLUMN IF NOT EXISTS work_days VARCHAR(20) DEFAULT '1,2,3,4,5,6';

-- Tabla de servicios (corte, barba, tinte, etc.)
CREATE TABLE services (
  id             SERIAL PRIMARY KEY,
  barbershop_id  INT REFERENCES barbershops(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  duration_min   INT NOT NULL,        -- duración en minutos
  price          DECIMAL(10,2) NOT NULL,
  active         BOOLEAN DEFAULT true,
  image_url      VARCHAR(255),        -- imagen del servicio (catálogo y página pública)
  description    TEXT,                -- descripción corta del servicio
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Migración para bases ya existentes (la tabla services ya tenía datos):
-- ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url VARCHAR(255), ADD COLUMN IF NOT EXISTS description TEXT;

-- Tabla de horarios de atención (una fila por día de la semana por barbería)
CREATE TABLE business_hours (
  id             SERIAL PRIMARY KEY,
  barbershop_id  INT REFERENCES barbershops(id) ON DELETE CASCADE,
  day_of_week    INT NOT NULL,         -- 0 = domingo ... 6 = sábado (Date.getDay())
  open_time      TIME NOT NULL,
  close_time     TIME NOT NULL,
  is_open        BOOLEAN DEFAULT true,
  UNIQUE (barbershop_id, day_of_week)
);

-- Tabla de citas
CREATE TABLE appointments (
  id             SERIAL PRIMARY KEY,
  barbershop_id  INT REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_id      INT REFERENCES barbers(id),
  service_id     INT REFERENCES services(id),
  client_name    VARCHAR(100) NOT NULL,
  client_phone   VARCHAR(20) NOT NULL,
  client_email   VARCHAR(100),
  scheduled_at   TIMESTAMP NOT NULL,   -- fecha y hora de la cita
  status         VARCHAR(20) DEFAULT 'pending', -- pending | confirmed | cancelled | done
  reminder_sent  BOOLEAN DEFAULT false,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_appointments_barbershop ON appointments(barbershop_id);
CREATE INDEX idx_appointments_scheduled  ON appointments(scheduled_at);
CREATE INDEX idx_appointments_barber     ON appointments(barber_id);
CREATE INDEX idx_business_hours_barbershop ON business_hours(barbershop_id);