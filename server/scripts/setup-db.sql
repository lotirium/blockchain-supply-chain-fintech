-- Drop database and user if they exist
DROP DATABASE IF EXISTS shipment_db;
DROP USER IF EXISTS shipment_user;

-- Create user
CREATE USER shipment_user WITH PASSWORD 'shipment_password_123';

-- Create database
CREATE DATABASE shipment_db;

-- Connect to the database
\connect shipment_db;

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE shipment_db TO shipment_user;

-- Grant schema usage and create permissions
GRANT USAGE, CREATE ON SCHEMA public TO shipment_user;

-- Create tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_store_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ENUM types
CREATE TYPE enum_users_role AS ENUM ('user', 'seller', 'admin');
CREATE TYPE enum_users_type AS ENUM ('individual', 'business');

-- Grant all privileges on all tables to user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shipment_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO shipment_user;

-- Grant permissions for ENUM types
GRANT ALL PRIVILEGES ON TYPE enum_users_role TO shipment_user;
GRANT ALL PRIVILEGES ON TYPE enum_users_type TO shipment_user;

-- Make sure future tables grant permissions automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO shipment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO shipment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TYPES TO shipment_user;