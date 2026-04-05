DROP TABLE IF EXISTS saved_list_items CASCADE;
DROP TABLE IF EXISTS business_schedule_exceptions CASCADE;
DROP TABLE IF EXISTS business_schedule_rules CASCADE;
DROP TABLE IF EXISTS reservation_waitlist CASCADE;
DROP TABLE IF EXISTS business_requests CASCADE;
DROP TABLE IF EXISTS business_faqs CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS business_services CASCADE;
DROP TABLE IF EXISTS saved_lists CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'business')),
  bio TEXT,
  avatar_url TEXT,
  city VARCHAR(120),
  instagram_url TEXT,
  tiktok_url TEXT,
  featured_post_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  service_mode VARCHAR(20) NOT NULL DEFAULT 'booking' CHECK (service_mode IN ('booking', 'session', 'request')),
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  address VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  visit_note TEXT,
  cancellation_policy TEXT,
  hero_badge VARCHAR(80),
  hero_claim VARCHAR(160),
  hero_highlight TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_services (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL DEFAULT 'service' CHECK (kind IN ('service', 'voucher', 'pack', 'request')),
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  price_label VARCHAR(80),
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_schedule_rules (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  open_time TIME,
  close_time TIME,
  slot_interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (slot_interval_minutes > 0),
  CHECK (
    (is_open = FALSE AND open_time IS NULL AND close_time IS NULL) OR
    (is_open = TRUE AND open_time IS NOT NULL AND close_time IS NOT NULL AND close_time > open_time)
  ),
  UNIQUE (business_id, day_of_week)
);

CREATE TABLE business_schedule_exceptions (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT TRUE,
  open_time TIME,
  close_time TIME,
  slot_interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (slot_interval_minutes > 0),
  note VARCHAR(240),
  CHECK (
    (is_closed = TRUE AND open_time IS NULL AND close_time IS NULL) OR
    (is_closed = FALSE AND open_time IS NOT NULL AND close_time IS NOT NULL AND close_time > open_time)
  ),
  UNIQUE (business_id, exception_date)
);

CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_service_id INTEGER REFERENCES business_services(id) ON DELETE SET NULL,
  reservation_date TIMESTAMPTZ NOT NULL,
  people INTEGER NOT NULL CHECK (people > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservation_waitlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_service_id INTEGER REFERENCES business_services(id) ON DELETE SET NULL,
  desired_slot TIMESTAMPTZ NOT NULL,
  people INTEGER NOT NULL CHECK (people > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, business_id, business_service_id, desired_slot, status)
);

CREATE TABLE business_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_service_id INTEGER REFERENCES business_services(id) ON DELETE SET NULL,
  preferred_date TIMESTAMPTZ,
  proposed_date TIMESTAMPTZ,
  recipient_name VARCHAR(120),
  participants INTEGER NOT NULL CHECK (participants > 0),
  quoted_price_label VARCHAR(80),
  message TEXT NOT NULL,
  business_reply TEXT,
  fulfillment_note TEXT,
  voucher_code VARCHAR(40),
  voucher_status VARCHAR(20) CHECK (voucher_status IS NULL OR voucher_status IN ('draft', 'issued', 'redeemed')),
  business_reply_updated_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'accepted', 'declined')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_faqs (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  question VARCHAR(160) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  business_response TEXT,
  business_response_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, business_id)
);

CREATE TABLE saved_lists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  share_slug VARCHAR(160) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, name)
);

CREATE TABLE saved_list_items (
  list_id INTEGER NOT NULL REFERENCES saved_lists(id) ON DELETE CASCADE,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, business_id)
);

CREATE INDEX idx_businesses_category_id ON businesses(category_id);
CREATE INDEX idx_business_services_business_id ON business_services(business_id, created_at);
CREATE INDEX idx_business_schedule_rules_business_id_day ON business_schedule_rules(business_id, day_of_week);
CREATE INDEX idx_business_schedule_exceptions_business_id_date ON business_schedule_exceptions(business_id, exception_date);
CREATE INDEX idx_business_requests_user_id_date ON business_requests(user_id, created_at DESC);
CREATE INDEX idx_business_requests_business_id_date ON business_requests(business_id, created_at DESC);
CREATE INDEX idx_business_faqs_business_id_order ON business_faqs(business_id, sort_order, id);
CREATE INDEX idx_reservations_user_id_date ON reservations(user_id, reservation_date);
CREATE INDEX idx_reservations_business_id_date ON reservations(business_id, reservation_date);
CREATE INDEX idx_reservations_service_id_date ON reservations(business_service_id, reservation_date);
CREATE INDEX idx_waitlist_user_id_date ON reservation_waitlist(user_id, desired_slot);
CREATE INDEX idx_waitlist_business_id_date ON reservation_waitlist(business_id, desired_slot);
CREATE INDEX idx_waitlist_service_id_date ON reservation_waitlist(business_service_id, desired_slot);
CREATE INDEX idx_reviews_business_id ON reviews(business_id);
CREATE INDEX idx_saved_lists_user_id_date ON saved_lists(user_id, created_at DESC);
CREATE INDEX idx_saved_lists_public_date ON saved_lists(is_public, created_at DESC);
CREATE INDEX idx_saved_list_items_business_id ON saved_list_items(business_id);

INSERT INTO categories (name) VALUES
  ('Restauracion'),
  ('Cafeterias y brunch'),
  ('Deporte'),
  ('Bienestar y estetica'),
  ('Ocio'),
  ('Turismo y visitas guiadas'),
  ('Cultura y talleres'),
  ('Formacion y clases');

INSERT INTO users (
  name,
  email,
  password_hash,
  role,
  bio,
  avatar_url,
  city,
  instagram_url,
  tiktok_url,
  featured_post_url
) VALUES
  (
    'Surf Zurriola',
    'surf@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Escuela local de surf con clases para principiantes y alquiler de material.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    'Donostia-San Sebastian',
    'https://www.instagram.com/',
    NULL,
    NULL
  ),
  (
    'Ane Iglesias',
    'ane@donostigo.local',
    '$2b$10$w/SskIg3vFZ49Ym5YBGW2O57PzWqqbUkmsIC38Xuet0OgDjPGiMdy',
    'user',
    'Me gusta descubrir planes locales, probar actividades nuevas y dejar una opinion util para otros usuarios.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    'Donostia-San Sebastian',
    'https://www.instagram.com/',
    'https://www.tiktok.com/',
    'https://www.tiktok.com/'
  ),
  (
    'Iker Martin',
    'iker@donostigo.local',
    '$2b$10$w/SskIg3vFZ49Ym5YBGW2O57PzWqqbUkmsIC38Xuet0OgDjPGiMdy',
    'user',
    'Suelo reservar planes para el fin de semana y comparar distintas opciones antes de decidirme.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Sidreria Parte Vieja',
    'sidreria.partevieja@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Sidreria centrada en menus tradicionales y comidas para grupos pequenos.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'La Concha Bistro',
    'laconcha.bistro@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Bistro de temporada junto a la bahia con reservas para comidas y cenas.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Brunch Gros',
    'brunch.gros@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Espacio de desayunos y brunch con turnos de reserva durante el fin de semana.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Kafea Zurriola',
    'kafea.zurriola@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Cafeteria de especialidad cerca de la playa con meriendas y reservas pequenas.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Donosti Bike Tours',
    'bike.tours@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Alquiler de bicicletas y rutas guiadas para visitantes y grupos reducidos.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Paddle Center Donosti',
    'paddle.center@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Centro de actividades acuaticas con clases de iniciacion y alquiler por horas.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Centro Wellness Amara',
    'wellness.amara@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Centro de masajes y bienestar con agenda sencilla de reservas.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Nerea Estudio Facial',
    'nerea.facial@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Estudio de cuidado facial y tratamientos personalizados por cita.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Escape Room Kontxa',
    'escape.kontxa@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Sala de escape con sesiones privadas para grupos pequenos.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Sala Retro Donosti',
    'retro.donosti@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Espacio de ocio con arcades y actividades reservables para grupos.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Donosti Walking Tours',
    'walking.tours@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Visitas guiadas por el centro y la Parte Vieja con horario reservado.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Paseos en Bici Txuri',
    'bici.txuri@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Recorridos en bici por la ciudad para parejas, familias y pequenos grupos.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Taller Creativo Egia',
    'taller.egia@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Taller de ilustracion y manualidades con plazas reservables.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Ceramica Bahia',
    'ceramica.bahia@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Espacio de ceramica con cursos cortos y sesiones de iniciacion.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Academia Euskera Gros',
    'euskera.gros@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Academia con grupos reducidos y reserva de plaza para clases de apoyo.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  ),
  (
    'Escuela de Cocina Donosti',
    'cocina.donosti@donostigo.local',
    '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne',
    'business',
    'Talleres de cocina y experiencias gastronomicas con plazas limitadas.',
    NULL,
    'Donostia-San Sebastian',
    NULL,
    NULL,
    NULL
  );

INSERT INTO businesses (user_id, category_id, service_mode, name, description, address, phone)
SELECT
  u.id,
  c.id,
  seed.service_mode,
  seed.business_name,
  seed.business_description,
  seed.business_address,
  seed.business_phone
FROM (
  VALUES
    (
      'surf@donostigo.local',
      'Deporte',
      'session',
      'Surf Zurriola',
      'Escuela local con clases para principiantes y alquiler de material.',
      'Zurriola Hiribidea 12, Donostia-San Sebastian',
      '943000111'
    ),
    (
      'sidreria.partevieja@donostigo.local',
      'Restauracion',
      'booking',
      'Sidreria Parte Vieja',
      'Sidreria local con menu tradicional y reservas para comidas y cenas en la Parte Vieja.',
      'Calle 31 de Agosto 18, Donostia-San Sebastian',
      '943100101'
    ),
    (
      'laconcha.bistro@donostigo.local',
      'Restauracion',
      'booking',
      'La Concha Bistro',
      'Bistro centrado en cocina de temporada con servicio de reserva online para grupos pequenos.',
      'Paseo de La Concha 12, Donostia-San Sebastian',
      '943100102'
    ),
    (
      'brunch.gros@donostigo.local',
      'Cafeterias y brunch',
      'booking',
      'Brunch Gros',
      'Local especializado en desayunos y brunch con turnos de reserva durante el fin de semana.',
      'Calle Zabaleta 22, Donostia-San Sebastian',
      '943100103'
    ),
    (
      'kafea.zurriola@donostigo.local',
      'Cafeterias y brunch',
      'request',
      'Kafea Zurriola',
      'Cafeteria junto a la playa con cafe de especialidad y espacio para reservas pequenas.',
      'Zurriola Hiribidea 8, Donostia-San Sebastian',
      '943100104'
    ),
    (
      'bike.tours@donostigo.local',
      'Deporte',
      'request',
      'Donosti Bike Tours',
      'Alquiler de bicicletas y rutas guiadas por la ciudad con reserva previa.',
      'Avenida de la Libertad 14, Donostia-San Sebastian',
      '943100105'
    ),
    (
      'paddle.center@donostigo.local',
      'Deporte',
      'session',
      'Paddle Center Donosti',
      'Clases y alquiler de material para actividades acuaticas con reservas por franja horaria.',
      'Paseo Nuevo 5, Donostia-San Sebastian',
      '943100106'
    ),
    (
      'wellness.amara@donostigo.local',
      'Bienestar y estetica',
      'booking',
      'Centro Wellness Amara',
      'Centro de masajes y bienestar con servicios individuales y bonos por cita.',
      'Avenida de Madrid 21, Donostia-San Sebastian',
      '943100107'
    ),
    (
      'nerea.facial@donostigo.local',
      'Bienestar y estetica',
      'request',
      'Nerea Estudio Facial',
      'Tratamientos faciales y cuidado personal con agenda de reservas online.',
      'Calle San Marcial 31, Donostia-San Sebastian',
      '943100108'
    ),
    (
      'escape.kontxa@donostigo.local',
      'Ocio',
      'session',
      'Escape Room Kontxa',
      'Sala de escape para grupos pequenos con sesiones reservables desde la plataforma.',
      'Calle Easo 17, Donostia-San Sebastian',
      '943100109'
    ),
    (
      'retro.donosti@donostigo.local',
      'Ocio',
      'session',
      'Sala Retro Donosti',
      'Espacio de ocio con juegos arcade, eventos tematicos y reservas para grupos.',
      'Calle Matia 9, Donostia-San Sebastian',
      '943100110'
    ),
    (
      'walking.tours@donostigo.local',
      'Turismo y visitas guiadas',
      'session',
      'Donosti Walking Tours',
      'Rutas guiadas por el centro y la Parte Vieja con horarios reservables.',
      'Boulevard 1, Donostia-San Sebastian',
      '943100111'
    ),
    (
      'bici.txuri@donostigo.local',
      'Turismo y visitas guiadas',
      'request',
      'Paseos en Bici Txuri',
      'Recorridos guiados en bicicleta por Donostia para visitantes y grupos reducidos.',
      'Calle Prim 6, Donostia-San Sebastian',
      '943100112'
    ),
    (
      'taller.egia@donostigo.local',
      'Cultura y talleres',
      'session',
      'Taller Creativo Egia',
      'Espacio para talleres manuales, ilustracion y actividades creativas con reserva de plaza.',
      'Calle Egia 44, Donostia-San Sebastian',
      '943100113'
    ),
    (
      'ceramica.bahia@donostigo.local',
      'Cultura y talleres',
      'session',
      'Ceramica Bahia',
      'Taller de ceramica con cursos cortos, clases de iniciacion y grupos reducidos.',
      'Paseo de Francia 10, Donostia-San Sebastian',
      '943100114'
    ),
    (
      'euskera.gros@donostigo.local',
      'Formacion y clases',
      'session',
      'Academia Euskera Gros',
      'Clases de euskera en grupos pequenos con reserva de plaza para sesiones de apoyo.',
      'Calle Secundino Esnaola 15, Donostia-San Sebastian',
      '943100115'
    ),
    (
      'cocina.donosti@donostigo.local',
      'Formacion y clases',
      'session',
      'Escuela de Cocina Donosti',
      'Talleres de cocina para aficionados y experiencias gastronomicas con reserva previa.',
      'Calle Salamanca 3, Donostia-San Sebastian',
      '943100116'
    )
) AS seed (
  user_email,
  category_name,
  service_mode,
  business_name,
  business_description,
  business_address,
  business_phone
)
INNER JOIN users u ON u.email = seed.user_email
INNER JOIN categories c ON c.name = seed.category_name;

UPDATE businesses
SET
  visit_note = CASE name
    WHEN 'Surf Zurriola' THEN 'Trae toalla, ropa comoda y llega 15 minutos antes para preparar el material.'
    WHEN 'Brunch Gros' THEN 'Los fines de semana recomendamos llegar puntualmente para mantener el ritmo de turnos.'
    WHEN 'Centro Wellness Amara' THEN 'Si vienes con tiempo, puedes pasar antes por recepcion y relajarte un momento.'
    WHEN 'Donosti Walking Tours' THEN 'Usa calzado comodo y consulta el tiempo antes de la ruta.'
    ELSE visit_note
  END,
  cancellation_policy = CASE name
    WHEN 'Surf Zurriola' THEN 'Puedes cancelar o mover la reserva hasta 24 horas antes del inicio de la clase.'
    WHEN 'Brunch Gros' THEN 'Las reservas se liberan si hay un retraso superior a 15 minutos sin aviso previo.'
    WHEN 'Centro Wellness Amara' THEN 'Las citas pueden reprogramarse con 12 horas de antelacion.'
    WHEN 'Donosti Walking Tours' THEN 'Las plazas se mantienen hasta 12 horas antes. En caso de lluvia fuerte, el negocio puede reubicar la sesion.'
    ELSE cancellation_policy
  END,
  hero_badge = CASE name
    WHEN 'Surf Zurriola' THEN 'Experiencia local'
    WHEN 'Brunch Gros' THEN 'Plan de fin de semana'
    WHEN 'Centro Wellness Amara' THEN 'Cuidado personal'
    WHEN 'Donosti Walking Tours' THEN 'Ruta local'
    WHEN 'Nerea Estudio Facial' THEN 'Cita personalizada'
    ELSE hero_badge
  END,
  hero_claim = CASE name
    WHEN 'Surf Zurriola' THEN 'Clases, olas y plan de playa en una sola reserva.'
    WHEN 'Brunch Gros' THEN 'Brunch con ritmo de barrio y mesas muy buscadas.'
    WHEN 'Centro Wellness Amara' THEN 'Un hueco para bajar pulsaciones en mitad de la semana.'
    WHEN 'Donosti Walking Tours' THEN 'Descubre la ciudad con rutas pensadas para grupos pequeños.'
    WHEN 'Nerea Estudio Facial' THEN 'Tratamientos faciales planteados como una propuesta a medida.'
    ELSE hero_claim
  END,
  hero_highlight = CASE name
    WHEN 'Surf Zurriola' THEN 'La escuela combina clases grupales, sesiones privadas y bonos regalo con agenda viva por servicio.'
    WHEN 'Brunch Gros' THEN 'Ideal para mañanas largas, encuentros tranquilos y mesas con reserva previa en hora punta.'
    WHEN 'Centro Wellness Amara' THEN 'La ficha está pensada para que el usuario entienda rápido qué reservar, cuándo venir y cómo reprogramar.'
    WHEN 'Donosti Walking Tours' THEN 'Perfecto para visitantes que quieren una ruta cerrada o una salida más editorial según el momento del día.'
    WHEN 'Nerea Estudio Facial' THEN 'Aquí no todo es reserva directa: también puedes pedir diagnóstico, packs o bonos y esperar una propuesta cerrada.'
    ELSE hero_highlight
  END;

UPDATE users u
SET avatar_url = CASE c.name
  WHEN 'Restauracion' THEN 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
  WHEN 'Cafeterias y brunch' THEN 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80'
  WHEN 'Deporte' THEN 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80'
  WHEN 'Bienestar y estetica' THEN 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80'
  WHEN 'Ocio' THEN 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'
  WHEN 'Turismo y visitas guiadas' THEN 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'
  WHEN 'Cultura y talleres' THEN 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80'
  WHEN 'Formacion y clases' THEN 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80'
  ELSE avatar_url
END
FROM businesses b
LEFT JOIN categories c ON c.id = b.category_id
WHERE b.user_id = u.id
  AND u.role = 'business'
  AND u.avatar_url IS NULL;

UPDATE businesses b
SET
  hero_badge = COALESCE(
    b.hero_badge,
    CASE b.service_mode
      WHEN 'booking' THEN 'Reserva directa'
      WHEN 'session' THEN 'Plazas limitadas'
      ELSE 'Atencion a medida'
    END
  ),
  hero_claim = COALESCE(
    b.hero_claim,
    CASE c.name
      WHEN 'Restauracion' THEN 'Una propuesta local pensada para reservar sin fricción y disfrutar con tiempo.'
      WHEN 'Cafeterias y brunch' THEN 'Un plan de barrio para desayunar, quedar o alargar la mañana.'
      WHEN 'Deporte' THEN 'Actividad con agenda viva, plazas limitadas y foco claro en la experiencia.'
      WHEN 'Bienestar y estetica' THEN 'Una ficha diseñada para pedir cita o propuesta con total claridad.'
      WHEN 'Ocio' THEN 'Planes cerrados y experiencias que se entienden de un vistazo.'
      WHEN 'Turismo y visitas guiadas' THEN 'Descubrir Donostia también puede sentirse editorial y bien curado.'
      WHEN 'Cultura y talleres' THEN 'Plazas, materiales y sesiones explicadas como un portal real.'
      WHEN 'Formacion y clases' THEN 'Oferta pensada para grupos pequeños, seguimiento y continuidad.'
      ELSE 'Negocio local con una propuesta clara dentro de DonostiGo.'
    END
  ),
  hero_highlight = COALESCE(
    b.hero_highlight,
    CASE b.service_mode
      WHEN 'booking' THEN 'La experiencia combina agenda clara, horarios vivos y reserva directa desde la ficha pública.'
      WHEN 'session' THEN 'Cada servicio trabaja con cupos reales, turnos visibles y lista de espera cuando se completa una sesión.'
      ELSE 'Aquí la interacción es más flexible: el usuario envía una solicitud y el negocio responde con una propuesta cerrada.'
    END
  )
FROM categories c
WHERE c.id = b.category_id;

INSERT INTO business_services (business_id, kind, title, description, price_label, duration_minutes, capacity)
SELECT
  b.id,
  seed.kind,
  seed.title,
  seed.description,
  seed.price_label,
  seed.duration_minutes,
  seed.capacity
FROM (
  VALUES
    ('Surf Zurriola', 'service', 'Clase grupal de iniciacion', 'Sesion en grupo reducido con material incluido para dar los primeros pasos en el surf.', '35 €', 90, 6),
    ('Surf Zurriola', 'service', 'Clase privada premium', 'Sesion individual o en pareja con horario mas flexible y seguimiento personalizado.', '95 €', 90, 2),
    ('Sidreria Parte Vieja', 'service', 'Mesa para comida tradicional', 'Reserva orientada a comidas con menu sidreria y ambiente local en la Parte Vieja.', 'Desde 28 € por persona', 120, 8),
    ('La Concha Bistro', 'service', 'Cena de temporada', 'Turno de cena con propuesta de temporada y capacidad reducida por franja.', 'Ticket medio 32 €', 120, 6),
    ('Brunch Gros', 'service', 'Turno de brunch fin de semana', 'Mesa para brunch con rotacion por turnos y cocina de especialidad.', 'Desde 22 € por persona', 90, 4),
    ('Brunch Gros', 'service', 'Mesa en terraza', 'Turno exterior para desayunos y brunch con capacidad mas limitada.', 'Desde 24 € por persona', 90, 2),
    ('Kafea Zurriola', 'service', 'Solicitud de mesa pequena', 'Peticion flexible para meriendas, cafe o encuentros junto a la playa.', 'Segun consumo', 75, 4),
    ('Kafea Zurriola', 'pack', 'Pack desayuno oficina', 'Encargo para llevar con cafe, bolleria y opciones saladas pensado para reuniones o equipos pequenos.', 'Desde 42 €', NULL, NULL),
    ('Donosti Bike Tours', 'service', 'Ruta urbana privada', 'Solicitud de ruta guiada por la ciudad con salida adaptada al grupo.', 'Desde 45 €', 150, 8),
    ('Paddle Center Donosti', 'service', 'Clase de paddle surf', 'Sesion por plazas con monitor y material preparado en franja cerrada.', '30 €', 75, 8),
    ('Centro Wellness Amara', 'service', 'Masaje relajante', 'Cita individual con agenda previa y duracion cerrada.', '55 €', 60, 1),
    ('Centro Wellness Amara', 'service', 'Circuito express bienestar', 'Sesion mas corta para desconectar entre semana con capacidad muy reducida.', '35 €', 45, 1),
    ('Nerea Estudio Facial', 'service', 'Diagnostico y tratamiento facial', 'Solicitud de cita para valorar la piel y proponer tratamiento personalizado.', 'Desde 48 €', 60, 1),
    ('Nerea Estudio Facial', 'voucher', 'Bono glow regalo', 'Tarjeta regalo para regalar una experiencia facial abierta y cerrarla cuando mejor encaje.', '75 €', NULL, NULL),
    ('Escape Room Kontxa', 'service', 'Pase privado para grupo', 'Sesion cerrada para grupos pequenos con cupos limitados por pase.', '18 € por persona', 60, 6),
    ('Sala Retro Donosti', 'service', 'Sesion arcade para grupo', 'Reserva por pase con consolas, arcades y espacio privado.', 'Desde 14 € por persona', 90, 10),
    ('Donosti Walking Tours', 'service', 'Ruta guiada por la Parte Vieja', 'Pase con plazas limitadas para descubrir el centro historico.', '19 € por persona', 120, 12),
    ('Donosti Walking Tours', 'service', 'Ruta gastronomica al atardecer', 'Recorrido tematico con menos plazas y ritmo mas pausado.', '29 € por persona', 150, 8),
    ('Paseos en Bici Txuri', 'service', 'Solicitud de salida personalizada', 'Peticion para recorrido en bici ajustado al tamano y ritmo del grupo.', 'Desde 40 €', 150, 10),
    ('Paseos en Bici Txuri', 'voucher', 'Bono regalo pedalea Donosti', 'Bono abierto para regalar una salida guiada y fijar la fecha mas adelante.', '65 €', NULL, NULL),
    ('Taller Creativo Egia', 'service', 'Taller creativo de tarde', 'Sesion por plazas con materiales incluidos y cupo reducido.', '24 €', 120, 10),
    ('Ceramica Bahia', 'service', 'Iniciacion a la ceramica', 'Clase corta para crear una primera pieza en un grupo reducido.', '29 €', 120, 8),
    ('Academia Euskera Gros', 'service', 'Clase de apoyo en grupo', 'Plaza para sesiones de apoyo de euskera en formato reducido.', '16 €', 90, 10),
    ('Escuela de Cocina Donosti', 'service', 'Taller gastronomico tematico', 'Sesion con plazas limitadas y elaboracion guiada paso a paso.', '42 €', 150, 12)
) AS seed (business_name, kind, title, description, price_label, duration_minutes, capacity)
INNER JOIN businesses b ON b.name = seed.business_name;

INSERT INTO business_faqs (business_id, question, answer, sort_order)
SELECT
  b.id,
  seed.question,
  seed.answer,
  seed.sort_order
FROM (
  VALUES
    ('Surf Zurriola', '¿Hace falta experiencia previa?', 'No. La clase de iniciacion esta pensada precisamente para gente que empieza desde cero.', 1),
    ('Surf Zurriola', '¿Se incluye material?', 'Si, la escuela facilita tabla y neopreno en la experiencia grupal y privada.', 2),
    ('Brunch Gros', '¿Puedo ir con carrito o ninos?', 'Si, pero conviene indicarlo en la reserva para asignar la mesa mas comoda.', 1),
    ('Brunch Gros', '¿Hay opciones vegetarianas?', 'Si, el menu de brunch suele incluir varias opciones vegetarianas y alguna vegana.', 2),
    ('Centro Wellness Amara', '¿Puedo regalar una sesion?', 'Si, el negocio ofrece bonos y tarjetas regalo bajo solicitud directa.', 1),
    ('Donosti Walking Tours', '¿En que idioma se realiza la ruta?', 'Las salidas regulares se ofrecen en castellano, euskera e ingles segun disponibilidad.', 1)
) AS seed (business_name, question, answer, sort_order)
INNER JOIN businesses b ON b.name = seed.business_name;

INSERT INTO reservations (user_id, business_id, business_service_id, reservation_date, people, status)
SELECT
  u.id,
  b.id,
  s.id,
  seed.reservation_date::timestamptz,
  seed.people,
  seed.status
FROM (
  VALUES
    ('ane@donostigo.local', 'Surf Zurriola', 'Clase grupal de iniciacion', '2026-03-10 10:00:00+01', 2, 'confirmed'),
    ('iker@donostigo.local', 'Sidreria Parte Vieja', 'Mesa para comida tradicional', '2026-03-11 14:00:00+01', 2, 'confirmed'),
    ('ane@donostigo.local', 'Brunch Gros', 'Turno de brunch fin de semana', '2026-03-12 11:30:00+01', 3, 'confirmed'),
    ('iker@donostigo.local', 'Escape Room Kontxa', 'Pase privado para grupo', '2026-03-18 18:00:00+01', 4, 'pending')
) AS seed (user_email, business_name, service_title, reservation_date, people, status)
INNER JOIN users u ON u.email = seed.user_email
INNER JOIN businesses b ON b.name = seed.business_name
INNER JOIN business_services s ON s.business_id = b.id AND s.title = seed.service_title;

INSERT INTO reviews (user_id, business_id, rating, comment)
SELECT
  u.id,
  b.id,
  seed.rating,
  seed.comment
FROM (
  VALUES
    (
      'ane@donostigo.local',
      'Surf Zurriola',
      5,
      'La reserva fue sencilla y la experiencia estuvo muy bien organizada para gente que empezaba desde cero.'
    ),
    (
      'iker@donostigo.local',
      'Sidreria Parte Vieja',
      4,
      'Buen ambiente, servicio rapido y proceso de reserva comodo desde la web.'
    ),
    (
      'ane@donostigo.local',
      'Brunch Gros',
      4,
      'El local estaba muy bien y la reserva ayudo a evitar esperas en hora punta.'
    )
) AS seed (user_email, business_name, rating, comment)
INNER JOIN users u ON u.email = seed.user_email
INNER JOIN businesses b ON b.name = seed.business_name;

INSERT INTO saved_lists (user_id, name, description, is_public, share_slug)
SELECT
  u.id,
  seed.name,
  seed.description,
  seed.is_public,
  seed.share_slug
FROM (
  VALUES
    (
      'ane@donostigo.local',
      'Favoritos de Donosti',
      'Sitios que ya me interesan para reservar o recomendar.',
      TRUE,
      'favoritos-de-donosti-ane'
    ),
    (
      'ane@donostigo.local',
      'Pendientes para el finde',
      'Ideas guardadas para probar planes distintos durante el fin de semana.',
      FALSE,
      NULL
    ),
    (
      'iker@donostigo.local',
      'Planes tranquilos',
      'Negocios y actividades que quiero comparar antes de reservar.',
      TRUE,
      'planes-tranquilos-iker'
    )
) AS seed (user_email, name, description, is_public, share_slug)
INNER JOIN users u ON u.email = seed.user_email;

INSERT INTO saved_list_items (list_id, business_id)
SELECT
  l.id,
  b.id
FROM (
  VALUES
    ('ane@donostigo.local', 'Favoritos de Donosti', 'Surf Zurriola'),
    ('ane@donostigo.local', 'Favoritos de Donosti', 'Brunch Gros'),
    ('ane@donostigo.local', 'Pendientes para el finde', 'Escape Room Kontxa'),
    ('ane@donostigo.local', 'Pendientes para el finde', 'Ceramica Bahia'),
    ('iker@donostigo.local', 'Planes tranquilos', 'Centro Wellness Amara')
) AS seed (user_email, list_name, business_name)
INNER JOIN users u ON u.email = seed.user_email
INNER JOIN saved_lists l ON l.user_id = u.id AND l.name = seed.list_name
INNER JOIN businesses b ON b.name = seed.business_name;
