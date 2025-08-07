-- Dummy Database Setup for Testing
-- This creates a comprehensive e-commerce database with vast amounts of test data

-- Create database (PostgreSQL syntax)
CREATE DATABASE dummy_ecommerce;
\c dummy_ecommerce;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  subscription_type VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- Reviews table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  user_id INTEGER REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Insert dummy data (1000 users, 500 products, 2000 orders, 5000 order items, 1000 reviews, 8 categories)
INSERT INTO users (email, first_name, last_name, phone, address, city, country, subscription_type) 
SELECT 
  'user' || i || '@example.com',
  'User' || i,
  'LastName' || i,
  '+1-555-' || LPAD(i::text, 4, '0'),
  i || ' Main Street',
  CASE (i % 10)
    WHEN 0 THEN 'New York'
    WHEN 1 THEN 'Los Angeles'
    WHEN 2 THEN 'Chicago'
    WHEN 3 THEN 'Houston'
    WHEN 4 THEN 'Phoenix'
    WHEN 5 THEN 'Philadelphia'
    WHEN 6 THEN 'San Antonio'
    WHEN 7 THEN 'San Diego'
    WHEN 8 THEN 'Dallas'
    ELSE 'San Jose'
  END,
  'USA',
  CASE (i % 3)
    WHEN 0 THEN 'basic'
    WHEN 1 THEN 'premium'
    ELSE 'enterprise'
  END
FROM generate_series(1, 1000) i;

INSERT INTO products (name, description, price, category, brand, stock_quantity, sku) 
SELECT 
  'Product ' || i,
  'This is a description for product ' || i || '. It is a high-quality item with excellent features.',
  (RANDOM() * 1000 + 10)::DECIMAL(10,2),
  CASE (i % 8)
    WHEN 0 THEN 'Electronics'
    WHEN 1 THEN 'Clothing'
    WHEN 2 THEN 'Books'
    WHEN 3 THEN 'Home & Garden'
    WHEN 4 THEN 'Sports'
    WHEN 5 THEN 'Beauty'
    WHEN 6 THEN 'Toys'
    ELSE 'Automotive'
  END,
  CASE (i % 5)
    WHEN 0 THEN 'Brand A'
    WHEN 1 THEN 'Brand B'
    WHEN 2 THEN 'Brand C'
    WHEN 3 THEN 'Brand D'
    ELSE 'Brand E'
  END,
  (RANDOM() * 100)::INTEGER,
  'SKU-' || LPAD(i::text, 6, '0')
FROM generate_series(1, 500) i;

INSERT INTO orders (user_id, order_number, total_amount, status, payment_method) 
SELECT 
  (RANDOM() * 1000 + 1)::INTEGER,
  'ORD-' || LPAD(i::text, 8, '0'),
  (RANDOM() * 500 + 10)::DECIMAL(10,2),
  CASE (i % 4)
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'processing'
    WHEN 2 THEN 'shipped'
    ELSE 'delivered'
  END,
  CASE (i % 3)
    WHEN 0 THEN 'credit_card'
    WHEN 1 THEN 'paypal'
    ELSE 'bank_transfer'
  END
FROM generate_series(1, 2000) i;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
SELECT 
  (RANDOM() * 2000 + 1)::INTEGER,
  (RANDOM() * 500 + 1)::INTEGER,
  (RANDOM() * 5 + 1)::INTEGER,
  (RANDOM() * 100 + 5)::DECIMAL(10,2),
  (RANDOM() * 500 + 10)::DECIMAL(10,2)
FROM generate_series(1, 5000) i;

INSERT INTO reviews (product_id, user_id, rating, comment) 
SELECT 
  (RANDOM() * 500 + 1)::INTEGER,
  (RANDOM() * 1000 + 1)::INTEGER,
  (RANDOM() * 5 + 1)::INTEGER,
  'This is review ' || i || '. Great product, highly recommended!'
FROM generate_series(1, 1000) i;

INSERT INTO categories (name, description) VALUES 
('Electronics', 'Electronic devices and gadgets'),
('Clothing', 'Fashion and apparel'),
('Books', 'Books and literature'),
('Home & Garden', 'Home improvement and gardening'),
('Sports', 'Sports equipment and accessories'),
('Beauty', 'Beauty and personal care'),
('Toys', 'Toys and games'),
('Automotive', 'Automotive parts and accessories');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Create a view for order summaries
CREATE VIEW order_summary AS 
SELECT 
  o.id,
  o.order_number,
  u.first_name || ' ' || u.last_name as customer_name,
  o.total_amount,
  o.status,
  o.created_at,
  COUNT(oi.id) as item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, u.first_name, u.last_name, o.total_amount, o.status, o.created_at;

-- Create a view for product performance
CREATE VIEW product_performance AS 
SELECT 
  p.id,
  p.name,
  p.category,
  p.price,
  COUNT(oi.id) as times_ordered,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as review_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.name, p.category, p.price;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE dummy_ecommerce TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres; 