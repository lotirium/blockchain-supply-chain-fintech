-- Drop database and user if they exist
DROP DATABASE IF EXISTS shipment_db;
DROP USER IF EXISTS shipment_user;

-- Create user
CREATE USER shipment_user WITH PASSWORD 'shipment_password_123';

-- Create database
CREATE DATABASE shipment_db;

-- Connect to the database
\connect shipment_db;

-- Grant all privileges on database and schema
GRANT ALL PRIVILEGES ON DATABASE shipment_db TO shipment_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO shipment_user;
ALTER DATABASE shipment_db OWNER TO shipment_user;
ALTER SCHEMA public OWNER TO shipment_user;

-- Create ENUM types
SET ROLE shipment_user;

CREATE TYPE enum_users_role AS ENUM ('user', 'seller', 'admin');
CREATE TYPE enum_users_type AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE enum_stores_status AS ENUM ('pending', 'pending_verification', 'active', 'suspended');
CREATE TYPE enum_stores_type AS ENUM ('manufacturer', 'retailer');
CREATE TYPE enum_products_status AS ENUM ('draft', 'active', 'inactive', 'sold_out');
CREATE TYPE enum_orders_status AS ENUM ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE enum_orders_payment_method AS ENUM ('crypto', 'fiat');
CREATE TYPE enum_orders_payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE enum_products_blockchain_status AS ENUM ('pending', 'minted', 'failed');
CREATE TYPE enum_orders_qr_status AS ENUM ('not_generated', 'active', 'revoked');

RESET ROLE;

-- Create tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    type enum_users_type NOT NULL,
    role enum_users_role DEFAULT 'user',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    wallet_address VARCHAR(255),
    encrypted_private_key TEXT,
    iv VARCHAR(255),
    is_email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status enum_stores_status DEFAULT 'pending',
    type enum_stores_type DEFAULT 'manufacturer',
    business_email VARCHAR(255),
    business_phone VARCHAR(255),
    business_address TEXT,
    payment_details JSONB DEFAULT '{}',
    logo VARCHAR(255),
    banner VARCHAR(255),
    shipping_policy TEXT,
    return_policy TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    blockchain_verification_date TIMESTAMP WITH TIME ZONE,
    wallet_address VARCHAR(255) NOT NULL,
    private_key VARCHAR(64) NOT NULL,
    rating FLOAT DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    status enum_products_status DEFAULT 'draft',
    blockchain_status enum_products_blockchain_status DEFAULT 'pending',
    token_id VARCHAR(255) UNIQUE,
    manufacturer VARCHAR(255),
    category VARCHAR(255),
    images JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '[]',
    token_uri VARCHAR(255),
    hologram_data JSONB,
    shipment_stage VARCHAR(255),
    shipment_location VARCHAR(255),
    total_views INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    rating FLOAT DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    status enum_orders_status DEFAULT 'pending',
    total_fiat_amount DECIMAL(10,2) NOT NULL,
    total_crypto_amount VARCHAR(255),
    payment_method enum_orders_payment_method NOT NULL,
    payment_status enum_orders_payment_status DEFAULT 'pending',
    payment_details JSONB DEFAULT '{}',
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(255),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tracking_number VARCHAR(255),
    qr_data JSONB,
    qr_status enum_orders_qr_status DEFAULT 'not_generated',
    qr_verification_count INTEGER DEFAULT 0,
    qr_last_verified_at TIMESTAMP WITH TIME ZONE,
    transaction_hash VARCHAR(255),
    block_number INTEGER,
    current_location VARCHAR(255),
    estimated_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    rating INTEGER,
    review TEXT,
    review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Grant all privileges on all tables to user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shipment_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO shipment_user;

-- Make sure future tables grant permissions automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO shipment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO shipment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TYPES TO shipment_user;

-- Transfer ownership of all tables to shipment_user
ALTER TABLE users OWNER TO shipment_user;
ALTER TABLE categories OWNER TO shipment_user;
ALTER TABLE stores OWNER TO shipment_user;
ALTER TABLE products OWNER TO shipment_user;
ALTER TABLE orders OWNER TO shipment_user;
ALTER TABLE notifications OWNER TO shipment_user;

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_orders_qr_status ON orders(qr_status);