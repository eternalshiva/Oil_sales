-- Oil Inventory Management System Database Schema
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    conversion_factor DECIMAL(10,2) NOT NULL,
    unit_type VARCHAR(10) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('Sunflower', 'Palm', 'Lamp')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    number VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true
);

-- User profiles (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock log (daily inventory)
CREATE TABLE IF NOT EXISTS stock_log (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    opening INTEGER DEFAULT 0,
    receipts INTEGER DEFAULT 0,
    sales_office INTEGER DEFAULT 0,
    dispatch INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, date)
);

-- Vehicle sales (linked to stock log)
CREATE TABLE IF NOT EXISTS vehicle_sales (
    id SERIAL PRIMARY KEY,
    stock_log_id INTEGER REFERENCES stock_log(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    quantity INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_log_id, vehicle_id)
);

-- Dispatch log
CREATE TABLE IF NOT EXISTS dispatch_log (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    route_id INTEGER REFERENCES routes(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dispatch products
CREATE TABLE IF NOT EXISTS dispatch_products (
    id SERIAL PRIMARY KEY,
    dispatch_id INTEGER REFERENCES dispatch_log(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER DEFAULT 0
);

-- Price history
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    base_rate DECIMAL(10,2) NOT NULL,
    conversion_factor DECIMAL(10,2) NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id)
);

-- Insert initial products
INSERT INTO products (name, conversion_factor, unit_type, category) VALUES
('Sunflower Oil 30kg Can', 30, 'kg', 'Sunflower'),
('Sunflower Oil 15kg Can', 15, 'kg', 'Sunflower'),
('Sunflower Oil 15L Tin', 13.6, 'L', 'Sunflower'),
('Sunflower Gold 5L Box', 4.5, 'L', 'Sunflower'),
('Sunflower Gold 1L Box', 0.9, 'L', 'Sunflower'),
('Sunflower Gold 500ml Box', 0.45, 'ml', 'Sunflower'),
('Sunflower Gold 200ml Box', 0.18, 'ml', 'Sunflower'),
('Sunflower 850ml', 0.85, 'ml', 'Sunflower'),
('Sunflower 425ml', 0.425, 'ml', 'Sunflower'),
('Palm Oil 30kg Can', 30, 'kg', 'Palm'),
('Palm Oil 15kg Can', 15, 'kg', 'Palm'),
('Palm Oil 15L Tin', 13.6, 'L', 'Palm'),
('Palmstar 1L Box', 0.9, 'L', 'Palm'),
('Palmstar 500ml Box', 0.45, 'ml', 'Palm'),
('Palmstar 850ml', 0.85, 'ml', 'Palm'),
('Palmstar 425ml', 0.425, 'ml', 'Palm'),
('Lamp Oil 15L Tin', 13.6, 'L', 'Lamp'),
('Lamp Oil 5L Bottle', 4.5, 'L', 'Lamp'),
('Lamp Oil 1L Pouch', 0.9, 'L', 'Lamp'),
('Lamp Oil 500ml Pouch', 0.45, 'ml', 'Lamp')
ON CONFLICT (name) DO NOTHING;

-- Insert initial routes
INSERT INTO routes (name) VALUES
('Uthukottai'),
('Arakonam'),
('Acharapakkam'),
('Kalpakkam'),
('Poonamallee'),
('Ponneri'),
('ECR')
ON CONFLICT (name) DO NOTHING;

-- Insert initial vehicles
INSERT INTO vehicles (number) VALUES
('2259'),
('5149'),
('3083'),
('4080'),
('0456'),
('4567')
ON CONFLICT (number) DO NOTHING;

-- Insert initial prices
INSERT INTO price_history (product_id, base_rate, conversion_factor, is_current)
SELECT 
    p.id,
    CASE 
        WHEN p.category = 'Sunflower' THEN 130
        WHEN p.category = 'Palm' THEN 95
        WHEN p.category = 'Lamp' THEN 90
        ELSE 100
    END as base_rate,
    p.conversion_factor,
    true
FROM products p
ON CONFLICT DO NOTHING;

-- Insert initial stock with random opening balances
INSERT INTO stock_log (product_id, opening)
SELECT 
    p.id,
    FLOOR(RANDOM() * 30 + 5)::INTEGER as opening
FROM products p
ON CONFLICT (product_id, date) DO NOTHING;

-- Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Basic read policies (authenticated users can read)
CREATE POLICY "Users can read products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read routes" ON routes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read vehicles" ON vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read stock_log" ON stock_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read vehicle_sales" ON vehicle_sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read dispatch_log" ON dispatch_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read dispatch_products" ON dispatch_products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read price_history" ON price_history FOR SELECT USING (auth.role() = 'authenticated');

-- Write policies (authenticated users can write)
CREATE POLICY "Users can insert stock_log" ON stock_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update stock_log" ON stock_log FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert vehicle_sales" ON vehicle_sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update vehicle_sales" ON vehicle_sales FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert dispatch_log" ON dispatch_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can insert dispatch_products" ON dispatch_products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can insert price_history" ON price_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');