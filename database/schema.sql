DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

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
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  address VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reservation_date TIMESTAMPTZ NOT NULL,
  people INTEGER NOT NULL CHECK (people > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, business_id)
);

CREATE INDEX idx_businesses_category_id ON businesses(category_id);
CREATE INDEX idx_reservations_user_id_date ON reservations(user_id, reservation_date);
CREATE INDEX idx_reservations_business_id_date ON reservations(business_id, reservation_date);
CREATE INDEX idx_reviews_business_id ON reviews(business_id);

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
    'Ane Lopez',
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

INSERT INTO businesses (user_id, category_id, name, description, address, phone)
SELECT
  u.id,
  c.id,
  seed.business_name,
  seed.business_description,
  seed.business_address,
  seed.business_phone
FROM (
  VALUES
    (
      'surf@donostigo.local',
      'Deporte',
      'Surf Zurriola',
      'Escuela local con clases para principiantes y alquiler de material.',
      'Zurriola Hiribidea 12, Donostia-San Sebastian',
      '943000111'
    ),
    (
      'sidreria.partevieja@donostigo.local',
      'Restauracion',
      'Sidreria Parte Vieja',
      'Sidreria local con menu tradicional y reservas para comidas y cenas en la Parte Vieja.',
      'Calle 31 de Agosto 18, Donostia-San Sebastian',
      '943100101'
    ),
    (
      'laconcha.bistro@donostigo.local',
      'Restauracion',
      'La Concha Bistro',
      'Bistro centrado en cocina de temporada con servicio de reserva online para grupos pequenos.',
      'Paseo de La Concha 12, Donostia-San Sebastian',
      '943100102'
    ),
    (
      'brunch.gros@donostigo.local',
      'Cafeterias y brunch',
      'Brunch Gros',
      'Local especializado en desayunos y brunch con turnos de reserva durante el fin de semana.',
      'Calle Zabaleta 22, Donostia-San Sebastian',
      '943100103'
    ),
    (
      'kafea.zurriola@donostigo.local',
      'Cafeterias y brunch',
      'Kafea Zurriola',
      'Cafeteria junto a la playa con cafe de especialidad y espacio para reservas pequenas.',
      'Zurriola Hiribidea 8, Donostia-San Sebastian',
      '943100104'
    ),
    (
      'bike.tours@donostigo.local',
      'Deporte',
      'Donosti Bike Tours',
      'Alquiler de bicicletas y rutas guiadas por la ciudad con reserva previa.',
      'Avenida de la Libertad 14, Donostia-San Sebastian',
      '943100105'
    ),
    (
      'paddle.center@donostigo.local',
      'Deporte',
      'Paddle Center Donosti',
      'Clases y alquiler de material para actividades acuaticas con reservas por franja horaria.',
      'Paseo Nuevo 5, Donostia-San Sebastian',
      '943100106'
    ),
    (
      'wellness.amara@donostigo.local',
      'Bienestar y estetica',
      'Centro Wellness Amara',
      'Centro de masajes y bienestar con servicios individuales y bonos por cita.',
      'Avenida de Madrid 21, Donostia-San Sebastian',
      '943100107'
    ),
    (
      'nerea.facial@donostigo.local',
      'Bienestar y estetica',
      'Nerea Estudio Facial',
      'Tratamientos faciales y cuidado personal con agenda de reservas online.',
      'Calle San Marcial 31, Donostia-San Sebastian',
      '943100108'
    ),
    (
      'escape.kontxa@donostigo.local',
      'Ocio',
      'Escape Room Kontxa',
      'Sala de escape para grupos pequenos con sesiones reservables desde la plataforma.',
      'Calle Easo 17, Donostia-San Sebastian',
      '943100109'
    ),
    (
      'retro.donosti@donostigo.local',
      'Ocio',
      'Sala Retro Donosti',
      'Espacio de ocio con juegos arcade, eventos tematicos y reservas para grupos.',
      'Calle Matia 9, Donostia-San Sebastian',
      '943100110'
    ),
    (
      'walking.tours@donostigo.local',
      'Turismo y visitas guiadas',
      'Donosti Walking Tours',
      'Rutas guiadas por el centro y la Parte Vieja con horarios reservables.',
      'Boulevard 1, Donostia-San Sebastian',
      '943100111'
    ),
    (
      'bici.txuri@donostigo.local',
      'Turismo y visitas guiadas',
      'Paseos en Bici Txuri',
      'Recorridos guiados en bicicleta por Donostia para visitantes y grupos reducidos.',
      'Calle Prim 6, Donostia-San Sebastian',
      '943100112'
    ),
    (
      'taller.egia@donostigo.local',
      'Cultura y talleres',
      'Taller Creativo Egia',
      'Espacio para talleres manuales, ilustracion y actividades creativas con reserva de plaza.',
      'Calle Egia 44, Donostia-San Sebastian',
      '943100113'
    ),
    (
      'ceramica.bahia@donostigo.local',
      'Cultura y talleres',
      'Ceramica Bahia',
      'Taller de ceramica con cursos cortos, clases de iniciacion y grupos reducidos.',
      'Paseo de Francia 10, Donostia-San Sebastian',
      '943100114'
    ),
    (
      'euskera.gros@donostigo.local',
      'Formacion y clases',
      'Academia Euskera Gros',
      'Clases de euskera en grupos pequenos con reserva de plaza para sesiones de apoyo.',
      'Calle Secundino Esnaola 15, Donostia-San Sebastian',
      '943100115'
    ),
    (
      'cocina.donosti@donostigo.local',
      'Formacion y clases',
      'Escuela de Cocina Donosti',
      'Talleres de cocina para aficionados y experiencias gastronomicas con reserva previa.',
      'Calle Salamanca 3, Donostia-San Sebastian',
      '943100116'
    )
) AS seed (
  user_email,
  category_name,
  business_name,
  business_description,
  business_address,
  business_phone
)
INNER JOIN users u ON u.email = seed.user_email
INNER JOIN categories c ON c.name = seed.category_name;

INSERT INTO reservations (user_id, business_id, reservation_date, people, status)
SELECT
  u.id,
  b.id,
  seed.reservation_date::timestamptz,
  seed.people,
  seed.status
FROM (
  VALUES
    ('ane@donostigo.local', 'Surf Zurriola', '2026-03-10 10:00:00+01', 2, 'confirmed'),
    ('iker@donostigo.local', 'Sidreria Parte Vieja', '2026-03-11 14:00:00+01', 2, 'confirmed'),
    ('ane@donostigo.local', 'Brunch Gros', '2026-03-12 11:30:00+01', 3, 'confirmed'),
    ('iker@donostigo.local', 'Escape Room Kontxa', '2026-03-18 18:00:00+01', 4, 'pending')
) AS seed (user_email, business_name, reservation_date, people, status)
INNER JOIN users u ON u.email = seed.user_email
INNER JOIN businesses b ON b.name = seed.business_name;

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
