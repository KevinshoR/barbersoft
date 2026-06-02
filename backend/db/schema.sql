-- Tabla de barberías (cada cliente que paga es una barbería)
CREATE TABLE barbershops (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  address     VARCHAR(200),
  slug        VARCHAR(100) UNIQUE NOT NULL, -- URL pública: /reservar/mi-barberia
  -- Suscripción
  subscription_status  VARCHAR(20) DEFAULT 'trial', -- trial | active | blocked
  trial_ends_at        TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_ends_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Tabla de barberos (empleados del local)
CREATE TABLE barbers (
  id             SERIAL PRIMARY KEY,
  barbershop_id  INT REFERENCES barbershops(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  photo_url      VARCHAR(255),
  active         BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Tabla de servicios (corte, barba, tinte, etc.)
CREATE TABLE services (
  id             SERIAL PRIMARY KEY,
  barbershop_id  INT REFERENCES barbershops(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  duration_min   INT NOT NULL,        -- duración en minutos
  price          DECIMAL(10,2) NOT NULL,
  active         BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW()
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