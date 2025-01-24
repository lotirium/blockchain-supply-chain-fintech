-- Create database if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'shipment_db') THEN
        CREATE DATABASE shipment_db;
    END IF;
END
$$;

-- Connect to the database
\c shipment_db;

-- Create user if it doesn't exist and set password
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shipment_user') THEN
        CREATE USER shipment_user WITH PASSWORD 'shipment_password_123';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE shipment_db TO shipment_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shipment_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shipment_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO shipment_user;

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO shipment_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON SEQUENCES TO shipment_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON FUNCTIONS TO shipment_user;