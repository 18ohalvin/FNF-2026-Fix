import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

// Default database path for Docker volume mounting: /app/data/database.sqlite
const defaultDbPath = process.env.NODE_ENV === 'production'
  ? '/app/data/database.sqlite'
  : path.resolve(process.cwd(), 'data', 'database.sqlite')

const dbPath = process.env.DB_PATH || defaultDbPath

// Ensure directory exists
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

console.log(`[Database] Initializing SQLite database at: ${dbPath}`)

const db = new Database(dbPath, {
  fileMustExist: false
})

// Enable Write-Ahead Logging for speed & concurrency
db.pragma('journal_mode = WAL')

// Run Schema Migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS guests (
    phone TEXT PRIMARY KEY,
    salutation TEXT DEFAULT 'Mr.',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    instagram TEXT,
    role TEXT DEFAULT 'VIP GUEST',
    is_registered INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ticket_reservations (
    id TEXT PRIMARY KEY,
    guest_phone TEXT NOT NULL,
    access_id TEXT NOT NULL,
    selected_dates TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(guest_phone) REFERENCES guests(phone) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    guest_phone TEXT,
    access_id TEXT,
    guest_name TEXT,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
  CREATE INDEX IF NOT EXISTS idx_reservations_phone ON ticket_reservations(guest_phone);
  CREATE INDEX IF NOT EXISTS idx_reservations_access_id ON ticket_reservations(access_id);
  CREATE INDEX IF NOT EXISTS idx_scans_phone ON scans(guest_phone);
  CREATE INDEX IF NOT EXISTS idx_scans_access_id ON scans(access_id);
  CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(scanned_at);
`)

// Seed Default VIP Guest and initial scan logs for realistic occupancy
const seedVipGuest = () => {
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM guests WHERE phone = ?')
  const result = checkStmt.get('81707909707')

  if (result.count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO guests (phone, salutation, first_name, last_name, email, instagram, role, is_registered)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `)
    insertStmt.run(
      '81707909707',
      'Mr.',
      'ALVIN',
      'DECOROUS',
      '18ohalvin@gmail.com',
      '@ohalvin',
      'VIP GUEST'
    )
    console.log('[Database] Seeded default VIP record (81707909707 - MR. ALVIN DECOROUS)')
  }

  // Seed default reservation for VIP guest if empty
  const resCheck = db.prepare('SELECT COUNT(*) as count FROM ticket_reservations WHERE guest_phone = ?')
  if (resCheck.get('81707909707').count === 0) {
    db.prepare(`
      INSERT INTO ticket_reservations (id, guest_phone, access_id, selected_dates)
      VALUES (?, ?, ?, ?)
    `).run('res_default_01', '81707909707', '02-2008-1245', JSON.stringify(['day-1', 'day-2']))
  }
}

seedVipGuest()

export default db
