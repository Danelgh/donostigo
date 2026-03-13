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

INSERT INTO categories (name) VALUES
  ('Restauracion'),
  ('Deporte'),
  ('Bienestar'),
  ('Ocio');

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
  );

INSERT INTO businesses (user_id, category_id, name, description, address, phone) VALUES
  (
    1,
    2,
    'Surf Zurriola',
    'Escuela local con clases para principiantes y alquiler de material.',
    'Zurriola Hiribidea 12, Donostia',
    '943000111'
  );

INSERT INTO reservations (user_id, business_id, reservation_date, people, status) VALUES
  (2, 1, '2026-03-20 10:00:00', 2, 'pending');

INSERT INTO reviews (user_id, business_id, rating, comment) VALUES
  (
    2,
    1,
    5,
    'La reserva fue sencilla y la experiencia estuvo muy bien organizada para gente que empezaba desde cero.'
  );
