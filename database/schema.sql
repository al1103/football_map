
-- Tạo extension cho UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bảng người dùng
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'owner')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng sân bóng
CREATE TABLE football_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    price_per_hour DECIMAL(10, 2),
    field_type VARCHAR(20) DEFAULT '5vs5' CHECK (field_type IN ('5vs5', '7vs7', '11vs11', 'futsal')),
    surface_type VARCHAR(20) DEFAULT 'artificial' CHECK (surface_type IN ('grass', 'artificial', 'concrete')),
    has_lighting BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_changing_room BOOLEAN DEFAULT FALSE,
    has_shower BOOLEAN DEFAULT FALSE,
    capacity INTEGER DEFAULT 10,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    opening_hours JSONB,
    images JSONB,
    amenities TEXT[],
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_fields_location ON football_fields(latitude, longitude);
CREATE INDEX idx_fields_type ON football_fields(field_type);
CREATE INDEX idx_fields_rating ON football_fields(rating);
CREATE INDEX idx_fields_active ON football_fields(is_active);

-- Trigger để cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON football_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
