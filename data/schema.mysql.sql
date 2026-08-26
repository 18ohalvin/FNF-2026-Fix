-- ====================================================
-- FIX 707 Form - MySQL Production Database Schema
-- Compatible with MySQL 8.0+, MariaDB, PlanetScale, AWS RDS
-- ====================================================

-- 1. Guests Table
CREATE TABLE IF NOT EXISTS guests (
    phone VARCHAR(32) PRIMARY KEY,
    salutation VARCHAR(16) DEFAULT 'Mr.',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    instagram VARCHAR(100) DEFAULT '',
    role VARCHAR(50) DEFAULT 'VIP GUEST',
    is_registered TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Ticket Reservations Table
CREATE TABLE IF NOT EXISTS ticket_reservations (
    id VARCHAR(64) PRIMARY KEY,
    guest_phone VARCHAR(32) NOT NULL,
    access_id VARCHAR(32) NOT NULL,
    selected_dates TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_guest_mysql FOREIGN KEY (guest_phone) REFERENCES guests(phone) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Scans Table
CREATE TABLE IF NOT EXISTS scans (
    id VARCHAR(64) PRIMARY KEY,
    guest_phone VARCHAR(32),
    access_id VARCHAR(32),
    guest_name VARCHAR(200),
    action VARCHAR(20) NOT NULL,  -- 'check-in' | 'check-out'
    status VARCHAR(32) NOT NULL,  -- 'GRANTED' | 'ALREADY_INSIDE' | 'NOT_CHECKED_IN' | 'INVALID'
    message TEXT,
    event_day VARCHAR(32) DEFAULT 'day-1',
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. System Settings Table (Max Capacity, Global Configurations)
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Optimized Indexes
CREATE INDEX idx_reservations_phone ON ticket_reservations(guest_phone);
CREATE INDEX idx_reservations_access_id ON ticket_reservations(access_id);
CREATE INDEX idx_scans_phone ON scans(guest_phone);
CREATE INDEX idx_scans_access_id ON scans(access_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_scanned_at ON scans(scanned_at);
