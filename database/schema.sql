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

INSERT INTO categories (name) VALUES
  ('Restauracion'),
  ('Deporte'),
  ('Bienestar'),
  ('Ocio');

INSERT INTO users (name, email, password_hash, role) VALUES
  ('Surf Zurriola', 'surf@donostigo.local', '$2b$10$lvq/uli4SN4c6AipgAoLBOP2U10tGmKxNBN.p.Dja.NUTQCiUkvne', 'business'),
  ('Ane Lopez', 'ane@donostigo.local', '$2b$10$w/SskIg3vFZ49Ym5YBGW2O57PzWqqbUkmsIC38Xuet0OgDjPGiMdy', 'user');

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
