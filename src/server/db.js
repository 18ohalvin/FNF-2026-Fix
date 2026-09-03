import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

// Helper: Normalize phone numbers (strip non-digits, leading zero, country code 62)
export function normalizePhoneNumber(phone) {
  if (!phone) return ''
  let digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('62')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

// Helper: Normalize event day ID (e.g. '2026-09-02' -> '1', 'Day 2' -> '2', 'day-3' -> '3')
export function normalizeDayId(str) {
  if (!str) return '1'
  const s = String(str).trim().toLowerCase()
  
  // 1. Match ISO event dates & calendar labels (02 to 06 September 2026)
  if (s.includes('2026-09-02') || s.includes('02 sep') || s.includes('2 sep')) return '1'
  if (s.includes('2026-09-03') || s.includes('03 sep') || s.includes('3 sep')) return '2'
  if (s.includes('2026-09-04') || s.includes('04 sep') || s.includes('4 sep')) return '3'
  if (s.includes('2026-09-05') || s.includes('05 sep') || s.includes('5 sep')) return '4'
  if (s.includes('2026-09-06') || s.includes('06 sep') || s.includes('6 sep')) return '5'

  // 2. Match explicit "day-X" or "day X" patterns
  const dayMatch = s.match(/day[_\-\s]*(\d+)/i)
  if (dayMatch && dayMatch[1]) return dayMatch[1]

  // 3. Match single digit '1' through '5'
  if (/^[1-5]$/.test(s)) return s

  // 4. Default fallback
  return '1'
}

// Determine active database driver
const dbUrl = process.env.DATABASE_URL || ''
const explicitClient = (process.env.DB_CLIENT || '').toLowerCase()

let driverType = 'sqlite'
if (explicitClient === 'postgres' || dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  driverType = 'postgres'
} else if (explicitClient === 'mysql' || dbUrl.startsWith('mysql://')) {
  driverType = 'mysql'
}

console.log(`[Database] Initializing Universal Adapter (Driver: ${driverType.toUpperCase()})`)

class DatabaseAdapter {
  constructor() {
    this.driverType = driverType
    this.pgPool = null
    this.mysqlPool = null
    this.sqliteDb = null
    this.isInitialized = false
  }

  async connect() {
    if (this.isInitialized) return
    this.isInitialized = true

    if (this.driverType === 'postgres') {
      const { Pool } = await import('pg')
      const connectionString = process.env.DATABASE_URL
      const isSsl = !connectionString?.includes('localhost') && !connectionString?.includes('127.0.0.1')
      this.pgPool = new Pool({
        connectionString,
        ssl: isSsl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000
      })
      await this.initPostgresSchema()
    } else if (this.driverType === 'mysql') {
      const mysql = await import('mysql2/promise')
      this.mysqlPool = mysql.createPool(process.env.DATABASE_URL || {
        host: process.env.MYSQL_HOST || '127.0.0.1',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'fix_707_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      })
      await this.initMysqlSchema()
    } else {
      // SQLite Local Default
      const Database = (await import('better-sqlite3')).default
      const defaultDbPath = path.resolve(process.cwd(), 'data', 'database.sqlite')
      const dbPath = process.env.DB_PATH || defaultDbPath
      const dbDir = path.dirname(dbPath)
      if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

      this.sqliteDb = new Database(dbPath, { fileMustExist: false })
      this.sqliteDb.pragma('journal_mode = WAL')
      await this.initSqliteSchema()
    }

    await this.seedInitialData()
  }

  // --- Schema Migrations ---

  async initPostgresSchema() {
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS guests (
        phone VARCHAR(32) PRIMARY KEY,
        salutation VARCHAR(16) DEFAULT 'Mr.',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        instagram VARCHAR(100) DEFAULT '',
        role VARCHAR(50) DEFAULT 'VIP GUEST',
        is_registered SMALLINT DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ticket_reservations (
        id VARCHAR(64) PRIMARY KEY,
        guest_phone VARCHAR(32) NOT NULL,
        access_id VARCHAR(32) NOT NULL,
        selected_dates TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scans (
        id VARCHAR(64) PRIMARY KEY,
        guest_phone VARCHAR(32),
        access_id VARCHAR(32),
        guest_name VARCHAR(200),
        action VARCHAR(20) NOT NULL,
        status VARCHAR(32) NOT NULL,
        message TEXT,
        event_day VARCHAR(32) DEFAULT 'day-1',
        scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(64) PRIMARY KEY,
        setting_value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_pg_res_phone ON ticket_reservations(guest_phone);
      CREATE INDEX IF NOT EXISTS idx_pg_res_access_id ON ticket_reservations(access_id);
      CREATE INDEX IF NOT EXISTS idx_pg_scans_phone ON scans(guest_phone);
      CREATE INDEX IF NOT EXISTS idx_pg_scans_access_id ON scans(access_id);
    `)
  }

  async initMysqlSchema() {
    await this.mysqlPool.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS ticket_reservations (
        id VARCHAR(64) PRIMARY KEY,
        guest_phone VARCHAR(32) NOT NULL,
        access_id VARCHAR(32) NOT NULL,
        selected_dates TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_res_phone (guest_phone),
        INDEX idx_res_access (access_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id VARCHAR(64) PRIMARY KEY,
        guest_phone VARCHAR(32),
        access_id VARCHAR(32),
        guest_name VARCHAR(200),
        action VARCHAR(20) NOT NULL,
        status VARCHAR(32) NOT NULL,
        message TEXT,
        event_day VARCHAR(32) DEFAULT 'day-1',
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_scan_phone (guest_phone),
        INDEX idx_scan_access (access_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(64) PRIMARY KEY,
        setting_value TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
  }

  async initSqliteSchema() {
    this.sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS guests (
        phone TEXT PRIMARY KEY,
        salutation TEXT DEFAULT 'Mr.',
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        instagram TEXT DEFAULT '',
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        guest_phone TEXT,
        access_id TEXT,
        guest_name TEXT,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        event_day TEXT DEFAULT 'day-1',
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sqlite_guests_phone ON guests(phone);
      CREATE INDEX IF NOT EXISTS idx_sqlite_reservations_phone ON ticket_reservations(guest_phone);
      CREATE INDEX IF NOT EXISTS idx_sqlite_reservations_access_id ON ticket_reservations(access_id);
      CREATE INDEX IF NOT EXISTS idx_sqlite_scans_phone ON scans(guest_phone);
      CREATE INDEX IF NOT EXISTS idx_sqlite_scans_access_id ON scans(access_id);
    `)
  }

  async seedInitialData() {
    const existing = await this.getGuestByPhone('81707909707')
    if (!existing) {
      await this.upsertGuest({
        phone: '81707909707',
        salutation: 'Mr.',
        firstName: 'ALVIN',
        lastName: 'DECOROUS',
        email: '18ohalvin@gmail.com',
        instagram: '@ohalvin',
        role: 'VIP GUEST'
      })
      await this.createReservation({
        phone: '81707909707',
        accessId: 'G27535',
        selectedDates: ['day-1', 'day-2']
      })
    }
  }

  // --- CRUD: Guests ---

  async getGuestByPhone(phone) {
    await this.connect()
    const raw = String(phone).replace(/\D/g, '')
    const norm = normalizePhoneNumber(phone)

    if (this.driverType === 'postgres') {
      const res = await this.pgPool.query(
        `SELECT * FROM guests WHERE phone = $1 OR phone = $2 OR phone = $3 OR phone = $4 LIMIT 1`,
        [phone, raw, `0${norm}`, `62${norm}`]
      )
      return res.rows[0] || null
    } else if (this.driverType === 'mysql') {
      const [rows] = await this.mysqlPool.query(
        `SELECT * FROM guests WHERE phone = ? OR phone = ? OR phone = ? OR phone = ? LIMIT 1`,
        [phone, raw, `0${norm}`, `62${norm}`]
      )
      return rows[0] || null
    } else {
      return this.sqliteDb.prepare(
        `SELECT * FROM guests WHERE phone = ? OR phone = ? OR phone = ? OR phone = ? LIMIT 1`
      ).get(phone, raw, `0${norm}`, `62${norm}`) || null
    }
  }

  async getGuestByEmail(email) {
    if (!email) return null
    await this.connect()
    const mail = String(email).trim().toLowerCase()
    if (this.driverType === 'postgres') {
      const res = await this.pgPool.query(
        `SELECT * FROM guests WHERE LOWER(email) = $1 LIMIT 1`,
        [mail]
      )
      return res.rows[0] || null
    } else if (this.driverType === 'mysql') {
      const [rows] = await this.mysqlPool.query(
        `SELECT * FROM guests WHERE LOWER(email) = ? LIMIT 1`,
        [mail]
      )
      return rows[0] || null
    } else {
      return this.sqliteDb.prepare(
        `SELECT * FROM guests WHERE LOWER(email) = ? LIMIT 1`
      ).get(mail) || null
    }
  }

  async upsertGuest({ phone, salutation = 'Mr.', firstName = 'GUEST', lastName = '', email = 'guest@707.co.id', instagram = '', role = 'VIP GUEST' }) {
    await this.connect()
    const existing = await this.getGuestByPhone(phone)
    const rawPhone = existing ? existing.phone : normalizePhoneNumber(phone)
    const fName = String(firstName || 'GUEST').trim().toUpperCase()
    const lName = String(lastName || '').trim().toUpperCase()
    const mail = String(email || 'guest@707.co.id').trim().toLowerCase()
    const ig = String(instagram || '').trim()

    if (this.driverType === 'postgres') {
      await this.pgPool.query(
        `INSERT INTO guests (phone, salutation, first_name, last_name, email, instagram, role, is_registered, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(phone) DO UPDATE SET
           salutation = EXCLUDED.salutation,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           email = EXCLUDED.email,
           instagram = EXCLUDED.instagram,
           role = EXCLUDED.role,
           is_registered = 1,
           updated_at = CURRENT_TIMESTAMP`,
        [rawPhone, salutation, fName, lName, mail, ig, role]
      )
    } else if (this.driverType === 'mysql') {
      await this.mysqlPool.query(
        `INSERT INTO guests (phone, salutation, first_name, last_name, email, instagram, role, is_registered)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           salutation = VALUES(salutation),
           first_name = VALUES(first_name),
           last_name = VALUES(last_name),
           email = VALUES(email),
           instagram = VALUES(instagram),
           role = VALUES(role),
           is_registered = 1,
           updated_at = CURRENT_TIMESTAMP`,
        [rawPhone, salutation, fName, lName, mail, ig, role]
      )
    } else {
      this.sqliteDb.prepare(`
        INSERT INTO guests (phone, salutation, first_name, last_name, email, instagram, role, is_registered, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(phone) DO UPDATE SET
          salutation = excluded.salutation,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          email = excluded.email,
          instagram = excluded.instagram,
          role = excluded.role,
          is_registered = 1,
          updated_at = CURRENT_TIMESTAMP
      `).run(rawPhone, salutation, fName, lName, mail, ig, role)
    }
    return { success: true, phone: rawPhone }
  }

  async updateGuest(phone, updateData) {
    await this.connect()
    const guest = await this.getGuestByPhone(phone)
    if (!guest) return null

    const targetPhone = guest.phone
    const salutation = updateData.salutation || guest.salutation
    const firstName = String(updateData.firstName || guest.first_name).trim().toUpperCase()
    const lastName = String(updateData.lastName !== undefined ? updateData.lastName : guest.last_name).trim().toUpperCase()
    const email = String(updateData.email || guest.email).trim().toLowerCase()
    const role = updateData.role || guest.role

    if (this.driverType === 'postgres') {
      await this.pgPool.query(
        `UPDATE guests SET salutation = $1, first_name = $2, last_name = $3, email = $4, role = $5, updated_at = CURRENT_TIMESTAMP WHERE phone = $6`,
        [salutation, firstName, lastName, email, role, targetPhone]
      )
    } else if (this.driverType === 'mysql') {
      await this.mysqlPool.query(
        `UPDATE guests SET salutation = ?, first_name = ?, last_name = ?, email = ?, role = ? WHERE phone = ?`,
        [salutation, firstName, lastName, email, role, targetPhone]
      )
    } else {
      this.sqliteDb.prepare(
        `UPDATE guests SET salutation = ?, first_name = ?, last_name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`
      ).run(salutation, firstName, lastName, email, role, targetPhone)
    }

    // If reservation fields updated
    if (updateData.accessId !== undefined || updateData.selectedDates !== undefined) {
      const resv = await this.getReservationByPhone(targetPhone)
      const newAccess = updateData.accessId !== undefined ? (updateData.accessId || targetPhone) : (resv?.access_id || targetPhone)
      
      let newDates = resv?.selected_dates
      if (updateData.selectedDates !== undefined && updateData.selectedDates !== null) {
        newDates = typeof updateData.selectedDates === 'string' ? updateData.selectedDates : JSON.stringify(updateData.selectedDates)
      }
      if (!newDates) {
        newDates = JSON.stringify(['day-1'])
      }
      
      await this.createReservation({ phone: targetPhone, accessId: newAccess, selectedDates: newDates })
    }

    return await this.getGuestByPhone(targetPhone)
  }

  async deleteGuest(phone) {
    await this.connect()
    const guest = await this.getGuestByPhone(phone)
    if (!guest) return false

    const targetPhone = guest.phone
    if (this.driverType === 'postgres') {
      await this.pgPool.query(`DELETE FROM scans WHERE guest_phone = $1`, [targetPhone])
      await this.pgPool.query(`DELETE FROM ticket_reservations WHERE guest_phone = $1`, [targetPhone])
      await this.pgPool.query(`DELETE FROM guests WHERE phone = $1`, [targetPhone])
    } else if (this.driverType === 'mysql') {
      await this.mysqlPool.query(`DELETE FROM scans WHERE guest_phone = ?`, [targetPhone])
      await this.mysqlPool.query(`DELETE FROM ticket_reservations WHERE guest_phone = ?`, [targetPhone])
      await this.mysqlPool.query(`DELETE FROM guests WHERE phone = ?`, [targetPhone])
    } else {
      this.sqliteDb.prepare(`DELETE FROM scans WHERE guest_phone = ?`).run(targetPhone)
      this.sqliteDb.prepare(`DELETE FROM ticket_reservations WHERE guest_phone = ?`).run(targetPhone)
      this.sqliteDb.prepare(`DELETE FROM guests WHERE phone = ?`).run(targetPhone)
    }
    return true
  }

  // --- CRUD: Reservations ---

  async getReservationByPhone(phone) {
    await this.connect()
    const raw = String(phone).replace(/\D/g, '')
    const norm = normalizePhoneNumber(phone)

    if (this.driverType === 'postgres') {
      const res = await this.pgPool.query(
        `SELECT * FROM ticket_reservations WHERE guest_phone = $1 OR guest_phone = $2 OR guest_phone = $3 LIMIT 1`,
        [phone, raw, `0${norm}`]
      )
      return res.rows[0] || null
    } else if (this.driverType === 'mysql') {
      const [rows] = await this.mysqlPool.query(
        `SELECT * FROM ticket_reservations WHERE guest_phone = ? OR guest_phone = ? OR guest_phone = ? LIMIT 1`,
        [phone, raw, `0${norm}`]
      )
      return rows[0] || null
    } else {
      return this.sqliteDb.prepare(
        `SELECT * FROM ticket_reservations WHERE guest_phone = ? OR guest_phone = ? OR guest_phone = ? LIMIT 1`
      ).get(phone, raw, `0${norm}`) || null
    }
  }

  async getReservationByAccessId(accessId) {
    await this.connect()
    const raw = String(accessId).replace(/\D/g, '')
    const norm = normalizePhoneNumber(accessId)

    if (this.driverType === 'postgres') {
      const res = await this.pgPool.query(
        `SELECT r.*, g.salutation, g.first_name, g.last_name, g.email, g.role 
         FROM ticket_reservations r 
         LEFT JOIN guests g ON g.phone = r.guest_phone 
         WHERE LOWER(r.access_id) = LOWER($1) OR r.guest_phone = $1 OR r.guest_phone = $2 OR r.guest_phone = $3 LIMIT 1`,
        [accessId, raw, `0${norm}`]
      )
      return res.rows[0] || null
    } else if (this.driverType === 'mysql') {
      const [rows] = await this.mysqlPool.query(
        `SELECT r.*, g.salutation, g.first_name, g.last_name, g.email, g.role 
         FROM ticket_reservations r 
         LEFT JOIN guests g ON g.phone = r.guest_phone 
         WHERE LOWER(r.access_id) = LOWER(?) OR r.guest_phone = ? OR r.guest_phone = ? OR r.guest_phone = ? LIMIT 1`,
        [accessId, accessId, raw, `0${norm}`]
      )
      return rows[0] || null
    } else {
      return this.sqliteDb.prepare(
        `SELECT r.*, g.salutation, g.first_name, g.last_name, g.email, g.role 
         FROM ticket_reservations r 
         LEFT JOIN guests g ON g.phone = r.guest_phone 
         WHERE LOWER(r.access_id) = LOWER(?) OR r.guest_phone = ? OR r.guest_phone = ? OR r.guest_phone = ? LIMIT 1`
      ).get(accessId, accessId, raw, `0${norm}`) || null
    }
  }

  async getGuestByPhoneOrName(query) {
    await this.connect()
    if (!query || !String(query).trim()) return null
    const cleaned = String(query).trim()
    const raw = cleaned.replace(/\D/g, '')
    const norm = normalizePhoneNumber(cleaned)
    const pattern = `%${cleaned.toLowerCase()}%`

    if (this.driverType === 'postgres') {
      const res = await this.pgPool.query(
        `SELECT g.*, 
          (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as access_id,
          (SELECT r.selected_dates FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as selected_dates
         FROM guests g 
         WHERE g.phone = $1 OR g.phone = $2 OR g.phone = $3 
            OR LOWER(g.first_name) LIKE $4 OR LOWER(g.last_name) LIKE $4
            OR LOWER(CONCAT(g.first_name, ' ', g.last_name)) LIKE $4
            OR (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) LIKE $4
         ORDER BY g.created_at DESC LIMIT 1`,
        [cleaned, raw, `0${norm}`, pattern]
      )
      return res.rows[0] || null
    } else if (this.driverType === 'mysql') {
      const [rows] = await this.mysqlPool.query(
        `SELECT g.*, 
          (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as access_id,
          (SELECT r.selected_dates FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as selected_dates
         FROM guests g 
         WHERE g.phone = ? OR g.phone = ? OR g.phone = ? 
            OR LOWER(g.first_name) LIKE ? OR LOWER(g.last_name) LIKE ?
            OR LOWER(CONCAT(g.first_name, ' ', g.last_name)) LIKE ?
            OR (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) LIKE ?
         ORDER BY g.created_at DESC LIMIT 1`,
        [cleaned, raw, `0${norm}`, pattern, pattern, pattern, pattern]
      )
      return rows[0] || null
    } else {
      return this.sqliteDb.prepare(
        `SELECT g.*, 
          (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as access_id,
          (SELECT r.selected_dates FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as selected_dates
         FROM guests g 
         WHERE g.phone = ? OR g.phone = ? OR g.phone = ? 
            OR LOWER(g.first_name) LIKE ? OR LOWER(g.last_name) LIKE ?
            OR LOWER(g.first_name || ' ' || g.last_name) LIKE ?
            OR (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) LIKE ?
         ORDER BY g.created_at DESC LIMIT 1`
      ).get(cleaned, raw, `0${norm}`, pattern, pattern, pattern, pattern) || null
    }
  }

  async createReservation({ phone, accessId, selectedDates }) {
    await this.connect()
    let existingGuest = await this.getGuestByPhone(phone)
    if (!existingGuest) {
      const normPhone = normalizePhoneNumber(phone)
      await this.upsertGuest({ phone: normPhone, firstName: 'GUEST' })
      existingGuest = await this.getGuestByPhone(normPhone)
    }

    const guestPhoneKey = existingGuest ? existingGuest.phone : normalizePhoneNumber(phone)
    const id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const datesJson = typeof selectedDates === 'string' ? selectedDates : JSON.stringify(selectedDates)

    if (this.driverType === 'postgres') {
      await this.pgPool.query(`DELETE FROM ticket_reservations WHERE guest_phone = $1`, [guestPhoneKey])
      await this.pgPool.query(
        `INSERT INTO ticket_reservations (id, guest_phone, access_id, selected_dates) VALUES ($1, $2, $3, $4)`,
        [id, guestPhoneKey, accessId, datesJson]
      )
    } else if (this.driverType === 'mysql') {
      await this.mysqlPool.query(`DELETE FROM ticket_reservations WHERE guest_phone = ?`, [guestPhoneKey])
      await this.mysqlPool.query(
        `INSERT INTO ticket_reservations (id, guest_phone, access_id, selected_dates) VALUES (?, ?, ?, ?)`,
        [id, guestPhoneKey, accessId, datesJson]
      )
    } else {
      this.sqliteDb.prepare(`DELETE FROM ticket_reservations WHERE guest_phone = ?`).run(guestPhoneKey)
      this.sqliteDb.prepare(
        `INSERT INTO ticket_reservations (id, guest_phone, access_id, selected_dates) VALUES (?, ?, ?, ?)`
      ).run(id, guestPhoneKey, accessId, datesJson)
    }
    return { success: true, reservationId: id, accessId }
  }

  // --- Scans & Live Occupancy ---

  async recordScan({ id, guestPhone, accessId, guestName, action, status, message, eventDay = 'day-1', scannedAt }) {
    await this.connect()
    const scanId = id || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const nowIso = scannedAt || new Date().toISOString()

    if (this.driverType === 'postgres') {
      await this.pgPool.query(
        `INSERT INTO scans (id, guest_phone, access_id, guest_name, action, status, message, event_day, scanned_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [scanId, guestPhone, accessId, guestName, action, status, message, eventDay, nowIso]
      )
    } else if (this.driverType === 'mysql') {
      await this.mysqlPool.query(
        `INSERT INTO scans (id, guest_phone, access_id, guest_name, action, status, message, event_day, scanned_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [scanId, guestPhone, accessId, guestName, action, status, message, eventDay, nowIso]
      )
    } else {
      this.sqliteDb.prepare(`
        INSERT INTO scans (id, guest_phone, access_id, guest_name, action, status, message, event_day, scanned_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(scanId, guestPhone, accessId, guestName, action, status, message, eventDay, nowIso)
    }
    return scanId
  }

  async getLatestGrantedScan(phone, accessId) {
    await this.connect()
    const raw = String(phone || '').replace(/\D/g, '')

    if (this.driverType === 'postgres') {
      const res = await this.pgPool.query(
        `SELECT * FROM scans 
         WHERE status = 'GRANTED' AND (guest_phone = $1 OR guest_phone = $2 OR access_id = $3)
         ORDER BY scanned_at DESC LIMIT 1`,
        [phone, raw, accessId]
      )
      return res.rows[0] || null
    } else if (this.driverType === 'mysql') {
      const [rows] = await this.mysqlPool.query(
        `SELECT * FROM scans 
         WHERE status = 'GRANTED' AND (guest_phone = ? OR guest_phone = ? OR access_id = ?)
         ORDER BY scanned_at DESC LIMIT 1`,
        [phone, raw, accessId]
      )
      return rows[0] || null
    } else {
      return this.sqliteDb.prepare(`
        SELECT * FROM scans 
        WHERE status = 'GRANTED' AND (guest_phone = ? OR guest_phone = ? OR access_id = ?)
        ORDER BY rowid DESC LIMIT 1
      `).get(phone, raw, accessId) || null
    }
  }

  async getLiveOccupancy() {
    await this.connect()
    try {
      if (this.driverType === 'postgres') {
        const res = await this.pgPool.query(`
          SELECT COUNT(*) as count FROM (
            SELECT DISTINCT ON (guest_phone) action, status
            FROM scans
            WHERE status = 'GRANTED' AND guest_phone IS NOT NULL AND guest_phone != ''
            ORDER BY guest_phone, scanned_at DESC
          ) latest
          WHERE latest.action = 'check-in'
        `)
        return Math.max(0, parseInt(res.rows[0]?.count || 0, 10))
      } else if (this.driverType === 'mysql') {
        const [rows] = await this.mysqlPool.query(`
          SELECT COUNT(*) as count FROM (
            SELECT s.guest_phone
            FROM scans s
            INNER JOIN (
              SELECT guest_phone, MAX(scanned_at) as max_time
              FROM scans
              WHERE status = 'GRANTED' AND guest_phone IS NOT NULL AND guest_phone != ''
              GROUP BY guest_phone
            ) latest ON s.guest_phone = latest.guest_phone AND s.scanned_at = latest.max_time
            WHERE s.action = 'check-in'
          ) t
        `)
        return Math.max(0, parseInt(rows[0]?.count || 0, 10))
      } else {
        const row = this.sqliteDb.prepare(`
          SELECT COUNT(*) as count FROM (
            SELECT s.guest_phone
            FROM scans s
            INNER JOIN (
              SELECT guest_phone, MAX(rowid) as max_rowid
              FROM scans
              WHERE status = 'GRANTED' AND guest_phone IS NOT NULL AND guest_phone != ''
              GROUP BY guest_phone
            ) latest ON s.rowid = latest.max_rowid
            WHERE s.action = 'check-in'
          )
        `).get()
        return Math.max(0, row?.count || 0)
      }
    } catch (e) {
      console.warn('[Database] Live occupancy calc error:', e)
      return 0
    }
  }

  async getOccupancyStats(dayStr = '') {
    await this.connect()
    const current = await this.getLiveOccupancy()
    let checkedInToday = 0
    let checkedOutToday = 0
    let recentScans = []

    if (this.driverType === 'postgres') {
      const inRes = await this.pgPool.query("SELECT COUNT(*) as count FROM scans WHERE action = 'check-in' AND status = 'GRANTED'")
      const outRes = await this.pgPool.query("SELECT COUNT(*) as count FROM scans WHERE action = 'check-out' AND status = 'GRANTED'")
      const scansRes = await this.pgPool.query("SELECT * FROM scans ORDER BY scanned_at DESC LIMIT 50")
      checkedInToday = parseInt(inRes.rows[0]?.count || 0, 10)
      checkedOutToday = parseInt(outRes.rows[0]?.count || 0, 10)
      recentScans = scansRes.rows
    } else if (this.driverType === 'mysql') {
      const [inRows] = await this.mysqlPool.query("SELECT COUNT(*) as count FROM scans WHERE action = 'check-in' AND status = 'GRANTED'")
      const [outRows] = await this.mysqlPool.query("SELECT COUNT(*) as count FROM scans WHERE action = 'check-out' AND status = 'GRANTED'")
      const [scansRows] = await this.mysqlPool.query("SELECT * FROM scans ORDER BY scanned_at DESC LIMIT 50")
      checkedInToday = parseInt(inRows[0]?.count || 0, 10)
      checkedOutToday = parseInt(outRows[0]?.count || 0, 10)
      recentScans = scansRows
    } else {
      checkedInToday = this.sqliteDb.prepare("SELECT COUNT(*) as count FROM scans WHERE action = 'check-in' AND status = 'GRANTED'").get().count
      checkedOutToday = this.sqliteDb.prepare("SELECT COUNT(*) as count FROM scans WHERE action = 'check-out' AND status = 'GRANTED'").get().count
      recentScans = this.sqliteDb.prepare("SELECT * FROM scans ORDER BY rowid DESC LIMIT 50").all()
    }

    const capacity = await this.getMaxCapacity()

    return {
      current,
      capacity,
      checkedInToday,
      checkedOutToday,
      recentScans,
      eventDayText: dayStr || 'DAY 1 - MONDAY, 02 SEPTEMBER 2026'
    }
  }

  // --- System Settings: Max Capacity (1 - 10,000) ---

  async getMaxCapacity() {
    await this.connect()
    try {
      if (this.driverType === 'postgres') {
        const res = await this.pgPool.query(`SELECT setting_value FROM system_settings WHERE setting_key = 'max_capacity' LIMIT 1`)
        if (res.rows.length > 0) return parseInt(res.rows[0].setting_value, 10) || 100
      } else if (this.driverType === 'mysql') {
        const [rows] = await this.mysqlPool.query(`SELECT setting_value FROM system_settings WHERE setting_key = 'max_capacity' LIMIT 1`)
        if (rows.length > 0) return parseInt(rows[0].setting_value, 10) || 100
      } else {
        const row = this.sqliteDb.prepare(`SELECT setting_value FROM system_settings WHERE setting_key = 'max_capacity' LIMIT 1`).get()
        if (row) return parseInt(row.setting_value, 10) || 100
      }
    } catch (e) {
      console.warn('[Database] Fetch max_capacity fallback:', e.message)
    }
    return 100
  }

  async setMaxCapacity(capacity) {
    await this.connect()
    const capNum = Math.max(1, Math.min(10000, parseInt(capacity, 10) || 100))
    const valStr = String(capNum)

    if (this.driverType === 'postgres') {
      await this.pgPool.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES ('max_capacity', $1)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1`,
        [valStr]
      )
    } else if (this.driverType === 'mysql') {
      await this.mysqlPool.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES ('max_capacity', ?)
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [valStr, valStr]
      )
    } else {
      this.sqliteDb.prepare(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES ('max_capacity', ?)
         ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`
      ).run(valStr)
    }
    return capNum
  }

  async resetOccupancy() {
    await this.connect()
    if (this.driverType === 'postgres') {
      await this.pgPool.query('DELETE FROM scans')
    } else if (this.driverType === 'mysql') {
      await this.mysqlPool.query('DELETE FROM scans')
    } else {
      this.sqliteDb.prepare('DELETE FROM scans').run()
    }
    return true
  }

  // --- Customer Database List ---

  async getGuestsList({ search = '', filter = '', day = '' }) {
    await this.connect()
    const isPg = this.driverType === 'postgres'
    const isMysql = this.driverType === 'mysql'

    let sql = `
      SELECT g.*, 
        (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as access_id,
        (SELECT r.selected_dates FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as selected_dates
      FROM guests g
    `
    const conditions = []
    const params = []

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`
      const rawDigits = search.replace(/\D/g, '')
      const phoneQ = rawDigits ? `%${rawDigits}%` : q

      if (isPg) {
        params.push(q, q, q, phoneQ, q, q, q)
        conditions.push(`(LOWER(g.first_name) LIKE $${params.length - 6} OR LOWER(g.last_name) LIKE $${params.length - 5} OR g.phone LIKE $${params.length - 4} OR g.phone LIKE $${params.length - 3} OR LOWER(g.email) LIKE $${params.length - 2} OR LOWER(g.role) LIKE $${params.length - 1} OR (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) LIKE $${params.length})`)
      } else {
        params.push(q, q, q, phoneQ, q, q, q)
        conditions.push(`(LOWER(g.first_name) LIKE ? OR LOWER(g.last_name) LIKE ? OR g.phone LIKE ? OR g.phone LIKE ? OR LOWER(g.email) LIKE ? OR LOWER(g.role) LIKE ? OR (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) LIKE ?)`)
      }
    }

    if (filter === 'VIP') {
      conditions.push(`g.role LIKE '%VIP%'`)
    } else if (filter === 'PUBLIC') {
      conditions.push(`(g.role LIKE '%PUBLIC%' OR (g.role NOT LIKE '%VIP%' AND g.role NOT LIKE '%STAFF%'))`)
    }

    if (day && day.trim() && !day.toLowerCase().includes('all')) {
      const dayNum = normalizeDayId(day)
      const dayPattern = `%day-${dayNum}%`
      params.push(dayPattern)
      if (isPg) {
        conditions.push(`(SELECT r.selected_dates FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) LIKE $${params.length}`)
      } else {
        conditions.push(`(SELECT r.selected_dates FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) LIKE ?`)
      }
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ')
    }

    sql += ` ORDER BY g.created_at DESC`

    let rawGuests = []
    if (isPg) {
      const res = await this.pgPool.query(sql, params)
      rawGuests = res.rows
    } else if (isMysql) {
      const [rows] = await this.mysqlPool.query(sql, params)
      rawGuests = rows
    } else {
      rawGuests = this.sqliteDb.prepare(sql).all(...params)
    }

    // Attach latest scan details
    const enhanced = await Promise.all(rawGuests.map(async (g) => {
      const lastScan = await this.getLatestGrantedScan(g.phone, g.access_id)
      const isCheckedIn = lastScan && lastScan.action === 'check-in' ? 1 : 0
      return {
        ...g,
        is_checked_in: isCheckedIn,
        last_scanned_at: lastScan?.scanned_at || null
      }
    }))

    if (filter === 'CHECKED_IN') {
      return enhanced.filter(g => g.is_checked_in === 1)
    }

    return enhanced
  }

  // --- Analytics Dashboard Data ---

  async getAnalyticsData(dayOrDate = '') {
    await this.connect()
    const currentOccupancy = await this.getLiveOccupancy()
    let totalCheckedIn = 0
    let vipsCheckedIn = 0
    let failedScans = 0
    let totalReservations = 0

    const isPg = this.driverType === 'postgres'
    const isMysql = this.driverType === 'mysql'

    const dayNum = dayOrDate && !dayOrDate.toLowerCase().includes('all') ? normalizeDayId(dayOrDate) : '1'
    const dayTag = `day-${dayNum}`

    const timeSlots = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
    const totalCheckedInSlots = new Array(12).fill(0)
    const vipCheckedInSlots = new Array(12).fill(0)
    const failedScanSlots = new Array(12).fill(0)

    let scansList = []

    if (isPg) {
      const inRes = await this.pgPool.query("SELECT COUNT(DISTINCT guest_phone) as count FROM scans WHERE action = 'check-in' AND status = 'GRANTED' AND (event_day = $1 OR event_day LIKE $2)", [dayTag, `%${dayTag}%`])
      const vipRes = await this.pgPool.query("SELECT COUNT(DISTINCT s.guest_phone) as count FROM scans s LEFT JOIN guests g ON g.phone = s.guest_phone WHERE s.action = 'check-in' AND s.status = 'GRANTED' AND (s.event_day = $1 OR s.event_day LIKE $2) AND (g.role LIKE '%VIP%' OR s.message LIKE '%VIP%')", [dayTag, `%${dayTag}%`])
      const failRes = await this.pgPool.query("SELECT COUNT(*) as count FROM scans WHERE (status = 'INVALID' OR status = 'ALREADY_INSIDE' OR status = 'WRONG_DAY') AND (event_day = $1 OR event_day LIKE $2)", [dayTag, `%${dayTag}%`])
      const resvRes = await this.pgPool.query("SELECT COUNT(*) as count FROM ticket_reservations WHERE selected_dates LIKE $1", [`%${dayTag}%`])
      const scansRes = await this.pgPool.query("SELECT s.*, g.role as guest_role FROM scans s LEFT JOIN guests g ON g.phone = s.guest_phone WHERE s.event_day = $1 OR s.event_day LIKE $2", [dayTag, `%${dayTag}%`])

      totalCheckedIn = parseInt(inRes.rows[0]?.count || 0, 10)
      vipsCheckedIn = parseInt(vipRes.rows[0]?.count || 0, 10)
      failedScans = parseInt(failRes.rows[0]?.count || 0, 10)
      totalReservations = parseInt(resvRes.rows[0]?.count || 0, 10)
      scansList = scansRes.rows || []
    } else if (isMysql) {
      const [inRows] = await this.mysqlPool.query("SELECT COUNT(DISTINCT guest_phone) as count FROM scans WHERE action = 'check-in' AND status = 'GRANTED' AND (event_day = ? OR event_day LIKE ?)", [dayTag, `%${dayTag}%`])
      const [vipRows] = await this.mysqlPool.query("SELECT COUNT(DISTINCT s.guest_phone) as count FROM scans s LEFT JOIN guests g ON g.phone = s.guest_phone WHERE s.action = 'check-in' AND s.status = 'GRANTED' AND (s.event_day = ? OR s.event_day LIKE ?) AND (g.role LIKE '%VIP%' OR s.message LIKE '%VIP%')", [dayTag, `%${dayTag}%`])
      const [failRows] = await this.mysqlPool.query("SELECT COUNT(*) as count FROM scans WHERE (status = 'INVALID' OR status = 'ALREADY_INSIDE' OR status = 'WRONG_DAY') AND (event_day = ? OR event_day LIKE ?)", [dayTag, `%${dayTag}%`])
      const [resvRows] = await this.mysqlPool.query("SELECT COUNT(*) as count FROM ticket_reservations WHERE selected_dates LIKE ?", [`%${dayTag}%`])
      const [scansRows] = await this.mysqlPool.query("SELECT s.*, g.role as guest_role FROM scans s LEFT JOIN guests g ON g.phone = s.guest_phone WHERE s.event_day = ? OR s.event_day LIKE ?", [dayTag, `%${dayTag}%`])

      totalCheckedIn = parseInt(inRows[0]?.count || 0, 10)
      vipsCheckedIn = parseInt(vipRows[0]?.count || 0, 10)
      failedScans = parseInt(failRows[0]?.count || 0, 10)
      totalReservations = parseInt(resvRows[0]?.count || 0, 10)
      scansList = scansRows || []
    } else {
      totalCheckedIn = this.sqliteDb.prepare("SELECT COUNT(DISTINCT guest_phone) as count FROM scans WHERE action = 'check-in' AND status = 'GRANTED' AND (event_day = ? OR event_day LIKE ?)").get(dayTag, `%${dayTag}%`).count
      vipsCheckedIn = this.sqliteDb.prepare("SELECT COUNT(DISTINCT s.guest_phone) as count FROM scans s LEFT JOIN guests g ON g.phone = s.guest_phone WHERE s.action = 'check-in' AND s.status = 'GRANTED' AND (s.event_day = ? OR s.event_day LIKE ?) AND (g.role LIKE '%VIP%' OR s.message LIKE '%VIP%')").get(dayTag, `%${dayTag}%`).count
      failedScans = this.sqliteDb.prepare("SELECT COUNT(*) as count FROM scans WHERE (status = 'INVALID' OR status = 'ALREADY_INSIDE' OR status = 'WRONG_DAY') AND (event_day = ? OR event_day LIKE ?)").get(dayTag, `%${dayTag}%`).count
      totalReservations = this.sqliteDb.prepare("SELECT COUNT(*) as count FROM ticket_reservations WHERE selected_dates LIKE ?").get(`%${dayTag}%`).count
      scansList = this.sqliteDb.prepare("SELECT s.*, g.role as guest_role FROM scans s LEFT JOIN guests g ON g.phone = s.guest_phone WHERE s.event_day = ? OR s.event_day LIKE ?").all(dayTag, `%${dayTag}%`)
    }

    // Populate hourly buckets from real scan timestamps (GMT+7 Jakarta Time)
    const getJakartaHour = (scannedAt) => {
      if (!scannedAt) return 12
      let str = String(scannedAt)
      if (!str.includes('T') && !str.includes('Z') && str.length >= 19) {
        str = str.replace(' ', 'T') + 'Z'
      }
      const d = new Date(str)
      if (isNaN(d.getTime())) return 12

      try {
        const hourStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit' })
        const hour = parseInt(hourStr, 10)
        return isNaN(hour) ? 12 : hour
      } catch (e) {
        return d.getHours()
      }
    }

    scansList.forEach(s => {
      const hour = getJakartaHour(s.scanned_at)
      const slotIdx = Math.min(11, Math.max(0, Math.floor(hour / 2)))

      if (s.action === 'check-in' && s.status === 'GRANTED') {
        totalCheckedInSlots[slotIdx]++
        if ((s.guest_role && s.guest_role.includes('VIP')) || (s.message && s.message.includes('VIP'))) {
          vipCheckedInSlots[slotIdx]++
        }
      } else if (s.status === 'INVALID' || s.status === 'ALREADY_INSIDE' || s.status === 'WRONG_DAY') {
        failedScanSlots[slotIdx]++
      }
    })

    const upcomingArrivals = Math.max(0, totalReservations - totalCheckedIn)

    // Upcoming arrivals projected throughout peak event hours (10:00 - 20:00)
    const upcomingSlots = [0, 0, 0, 0, 0, Math.ceil(upcomingArrivals * 0.25), Math.ceil(upcomingArrivals * 0.35), Math.ceil(upcomingArrivals * 0.25), Math.ceil(upcomingArrivals * 0.15), 0, 0, 0]

    const series = {
      totalCheckedIn: timeSlots.map((slot, idx) => ({ slot, count: totalCheckedInSlots[idx] })),
      upcomingArrivals: timeSlots.map((slot, idx) => ({ slot, count: upcomingSlots[idx] })),
      vipsCheckedIn: timeSlots.map((slot, idx) => ({ slot, count: vipCheckedInSlots[idx] })),
      failedScans: timeSlots.map((slot, idx) => ({ slot, count: failedScanSlots[idx] }))
    }

    const capacity = await this.getMaxCapacity()
    const dayMap = {
      '1': 'DAY 1 - WEDNESDAY, 02 SEPTEMBER 2026',
      '2': 'DAY 2 - THURSDAY, 03 SEPTEMBER 2026',
      '3': 'DAY 3 - FRIDAY, 04 SEPTEMBER 2026',
      '4': 'DAY 4 - SATURDAY, 05 SEPTEMBER 2026',
      '5': 'DAY 5 - SUNDAY, 06 SEPTEMBER 2026'
    }
    const fullDayText = dayMap[String(dayNum)] || `DAY ${dayNum} - SEPTEMBER 2026`

    return {
      occupancy: {
        current: currentOccupancy,
        capacity,
        eventDayText: fullDayText
      },
      summary: {
        totalCheckedIn,
        upcomingArrivals,
        vipsCheckedIn,
        failedScans
      },
      series,
      hourlyArrivals: series.totalCheckedIn
    }
  }
}

// Export singleton database instance
const db = new DatabaseAdapter()
export default db
