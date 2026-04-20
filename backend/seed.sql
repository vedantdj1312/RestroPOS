USE restropos;

-- ══════════════════════════════════════════
-- RESET: Drop existing data for clean seed
-- ══════════════════════════════════════════
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS restaurant_tables;
DROP TABLE IF EXISTS categories;
SET FOREIGN_KEY_CHECKS = 1;

-- ══════════════════════════════════════════
-- RECREATE TABLES
-- ══════════════════════════════════════════

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT TRUE,
  is_veg BOOLEAN DEFAULT TRUE,
  prep_time INT DEFAULT 15,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE restaurant_tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  seating_capacity INT DEFAULT 4,
  status ENUM('Available', 'Occupied', 'Billed', 'Reserved') DEFAULT 'Available',
  reserved_at DATETIME NULL
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  status ENUM('Pending', 'Preparing', 'Completed', 'Cancelled', 'confirmed', 'settled') DEFAULT 'Pending',
  total_amount DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- ══════════════════════════════════════════
-- CATEGORIES
-- ══════════════════════════════════════════
INSERT INTO categories (id, name) VALUES
(1, 'Starters'),
(2, 'Main Course'),
(3, 'Breads'),
(4, 'Rice & Biryani'),
(5, 'Beverages'),
(6, 'Desserts'),
(7, 'Combos'),
(8, 'Chinese');

-- ══════════════════════════════════════════
-- TABLES (15 tables)
-- ══════════════════════════════════════════
INSERT INTO restaurant_tables (table_number) VALUES
(1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
(11), (12), (13), (14), (15);

-- ══════════════════════════════════════════
-- MENU ITEMS
-- (is_veg: 1 = Veg, 0 = Non-Veg)
-- ══════════════════════════════════════════

-- ─── Starters (cat 1) ───
INSERT INTO menu_items (category_id, name, price, is_veg, prep_time) VALUES
(1, 'Chicken Tikka',       300.00, 0, 20),
(1, 'Paneer Tikka',        260.00, 1, 15),
(1, 'Chicken Wings',       280.00, 0, 20),
(1, 'Hara Bhara Kabab',    160.00, 1, 15),
(1, 'Fish Amritsari',      320.00, 0, 20),
(1, 'Veg Spring Roll',     140.00, 1, 10),
(1, 'Tandoori Prawns',     380.00, 0, 25),
(1, 'Crispy Corn',         150.00, 1, 10);

-- ─── Main Course (cat 2) ───
INSERT INTO menu_items (category_id, name, price, is_veg, prep_time) VALUES
(2, 'Butter Chicken',      320.00, 0, 20),
(2, 'Dal Makhani',         220.00, 1, 25),
(2, 'Kadai Paneer',        260.00, 1, 20),
(2, 'Chicken Tikka Masala',320.00, 0, 20),
(2, 'Mutton Curry',        420.00, 0, 35),
(2, 'Palak Paneer',        240.00, 1, 20),
(2, 'Paneer Butter Masala',280.00, 1, 20),
(2, 'Paneer Masala',       300.00, 1, 15),
(2, 'Kaju Paneer',         250.00, 1, 15),
(2, 'Egg Curry',           180.00, 0, 15),
(2, 'Shahi Paneer',        270.00, 1, 20),
(2, 'Chicken Korma',       340.00, 0, 25);

-- ─── Breads (cat 3) ───
INSERT INTO menu_items (category_id, name, price, is_veg, prep_time) VALUES
(3, 'Butter Naan',          45.00, 1, 10),
(3, 'Garlic Naan',          55.00, 1, 10),
(3, 'Laccha Paratha',       60.00, 1, 10),
(3, 'Paratha',              40.00, 1, 8),
(3, 'Tandoori Roti',        30.00, 1, 8),
(3, 'Cheese Naan',          70.00, 1, 12),
(3, 'Missi Roti',           45.00, 1, 10);

-- ─── Rice & Biryani (cat 4) ───
INSERT INTO menu_items (category_id, name, price, is_veg, prep_time) VALUES
(4, 'Chicken Biryani',     280.00, 0, 30),
(4, 'Mutton Biryani',      380.00, 0, 35),
(4, 'Veg Biryani',         220.00, 1, 25),
(4, 'Jeera Rice',          120.00, 1, 15),
(4, 'Steamed Rice',         80.00, 1, 10),
(4, 'Egg Fried Rice',      160.00, 0, 15),
(4, 'Paneer Pulao',        200.00, 1, 20);

-- ─── Beverages (cat 5) ───
INSERT INTO menu_items (category_id, name, price, is_veg, prep_time) VALUES
(5, 'Cold Coffee',         120.00, 1, 8),
(5, 'Fresh Lime Soda',      70.00, 1, 5),
(5, 'Mango Lassi',          90.00, 1, 5),
(5, 'Masala Chai',           40.00, 1, 5),
(5, 'Pineapple Juice',     100.00, 1, 5),
(5, 'Buttermilk',            50.00, 1, 5),
(5, 'Mojito',              130.00, 1, 8),
(5, 'Watermelon Juice',     90.00, 1, 5);

-- ─── Desserts (cat 6) ───
INSERT INTO menu_items (category_id, name, price, is_veg, prep_time) VALUES
(6, 'Gulab Jamun',           80.00, 1, 5),
(6, 'Ice Cream',             90.00, 1, 2),
(6, 'Kulfi',                100.00, 1, 5),
(6, 'Rasmalai',             120.00, 1, 5),
(6, 'Gajar Ka Halwa',       110.00, 1, 10),
(6, 'Brownie with Ice Cream',160.00, 1, 8);

-- ─── Combos (cat 7) ───
INSERT INTO menu_items (category_id, name, price, is_veg, prep_time) VALUES
(7, 'Thali - Veg',          350.00, 1, 25),
(7, 'Thali - Non Veg',      450.00, 0, 30),
(7, 'Biryani Combo',        320.00, 0, 25),
(7, 'Family Pack Veg',      800.00, 1, 30);

-- ─── Chinese (cat 8) ───
INSERT INTO menu_items (category_id, name, price, is_veg, prep_time) VALUES
(8, 'Veg Manchurian',       180.00, 1, 15),
(8, 'Chicken Manchurian',   220.00, 0, 15),
(8, 'Veg Fried Rice',       160.00, 1, 12),
(8, 'Hakka Noodles',        170.00, 1, 12),
(8, 'Chicken Noodles',      200.00, 0, 15),
(8, 'Paneer Chilli',        210.00, 1, 15),
(8, 'Dragon Chicken',       250.00, 0, 18);
