import express from 'express'
import path from 'path'
import cors from 'cors'
import dotenv from 'dotenv'
import db from './src/server/db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 7070
const distPath = path.resolve(process.cwd(), 'dist')

// Middleware
app.use(cors())
app.use(express.json())

// ----------------------------------------------------
// REST API Routes
// ----------------------------------------------------

// 1. Health Probe
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
})

// 2. Check Phone Number Endpoint
app.post('/api/check-phone', (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    const rawDigits = phone.replace(/\D/g, '')

    // Search guests by phone or variants
    const stmt = db.prepare(`
      SELECT * FROM guests 
      WHERE phone = ? OR phone = ? OR phone = ?
    `)
    const guest = stmt.get(rawDigits, `0${rawDigits}`, `62${rawDigits}`)

    if (guest) {
      return res.json({
        found: true,
        guest: {
          phone: guest.phone,
          salutation: guest.salutation,
          firstName: guest.first_name,
          lastName: guest.last_name,
          email: guest.email,
          instagram: guest.instagram,
          role: guest.role,
          isRegistered: Boolean(guest.is_registered)
        }
      })
    } else {
      return res.json({
        found: false,
        guest: {
          phone: rawDigits,
          salutation: 'Mr.',
          firstName: '',
          lastName: '',
          email: '',
          instagram: '',
          role: 'VIP GUEST',
          isRegistered: false
        }
      })
    }
  } catch (err) {
    console.error('[API Check Phone Error]', err)
    res.status(500).json({ error: 'Internal server error checking phone number' })
  }
})

// 3. Upsert Guest Profile
app.post('/api/guests', (req, res) => {
  try {
    const phone = req.body.phone
    const firstName = req.body.firstName || req.body.first_name
    const lastName = req.body.lastName || req.body.last_name
    const email = req.body.email
    const salutation = req.body.salutation || 'Mr.'
    const instagram = req.body.instagram || ''
    const role = req.body.role || 'VIP GUEST'

    if (!phone || !firstName) {
      return res.status(400).json({ error: 'Phone number and Name are required' })
    }

    const rawPhone = String(phone).replace(/\D/g, '')

    const stmt = db.prepare(`
      INSERT INTO guests (phone, salutation, first_name, last_name, email, instagram, role, is_registered, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(phone) DO UPDATE SET
        salutation=excluded.salutation,
        first_name=excluded.first_name,
        last_name=excluded.last_name,
        email=excluded.email,
        instagram=excluded.instagram,
        role=excluded.role,
        is_registered=1,
        updated_at=CURRENT_TIMESTAMP
    `)

    stmt.run(
      rawPhone,
      salutation,
      String(firstName).trim().toUpperCase(),
      String(lastName || '').trim().toUpperCase(),
      String(email || 'guest@707.co.id').trim().toLowerCase(),
      String(instagram || '').trim(),
      role
    )

    res.json({ success: true, message: 'Guest details saved successfully', phone: rawPhone })
  } catch (err) {
    console.error('[API Save Guest Error]', err)
    res.status(500).json({ error: 'Internal server error saving guest details' })
  }
})

// 4. Create Reservation Endpoint
app.post('/api/reservations', (req, res) => {
  try {
    const { phone, accessId, selectedDates } = req.body

    if (!phone || !accessId || !selectedDates) {
      return res.status(400).json({ error: 'Missing required reservation parameters' })
    }

    const rawPhone = String(phone).replace(/\D/g, '')
    const id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const datesJson = typeof selectedDates === 'string' ? selectedDates : JSON.stringify(selectedDates)

    // Remove any previous reservation for this guest to keep latest
    db.prepare('DELETE FROM ticket_reservations WHERE guest_phone = ?').run(rawPhone)

    const stmt = db.prepare(`
      INSERT INTO ticket_reservations (id, guest_phone, access_id, selected_dates)
      VALUES (?, ?, ?, ?)
    `)

    stmt.run(id, rawPhone, accessId, datesJson)

    res.json({ success: true, reservationId: id, accessId })
  } catch (err) {
    console.error('[API Reservation Error]', err)
    res.status(500).json({ error: 'Internal server error creating reservation' })
  }
})

// ----------------------------------------------------
// Helper Functions for Occupancy & Event Day Logic
// ----------------------------------------------------

// Calculate live occupancy based on guests currently inside (latest granted scan is 'check-in')
function getLiveOccupancy() {
  try {
    const row = db.prepare(`
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
  } catch (e) {
    return 0
  }
}

// Helper to extract day number from day strings (e.g. 'Day 1', 'day-1', 'DAY 1 - MONDAY, 02 SEPTEMBER 2026')
function normalizeDayId(str) {
  if (!str) return '1'
  const match = String(str).match(/\d+/)
  return match ? match[0] : '1'
}

// Check if booked dates contain the target event day
function isDayAllowed(bookedDates, targetDay) {
  if (!bookedDates || (Array.isArray(bookedDates) && bookedDates.length === 0)) {
    return true // If no dates restricted, allow by default
  }
  const targetNum = normalizeDayId(targetDay)
  
  let datesArr = []
  if (Array.isArray(bookedDates)) {
    datesArr = bookedDates
  } else if (typeof bookedDates === 'string') {
    try {
      const parsed = JSON.parse(bookedDates)
      datesArr = Array.isArray(parsed) ? parsed : [bookedDates]
    } catch (e) {
      datesArr = bookedDates.split(',').map(s => s.trim())
    }
  }

  return datesArr.some(d => {
    const num = normalizeDayId(d)
    return num === targetNum
  })
}

// Format booked days for user-friendly error messages (e.g. "Day 1, Day 2")
function formatBookedDays(bookedDates) {
  let datesArr = []
  if (Array.isArray(bookedDates)) {
    datesArr = bookedDates
  } else if (typeof bookedDates === 'string') {
    try {
      const parsed = JSON.parse(bookedDates)
      datesArr = Array.isArray(parsed) ? parsed : [bookedDates]
    } catch (e) {
      datesArr = bookedDates.split(',').map(s => s.trim())
    }
  }
  return datesArr.map(d => `Day ${normalizeDayId(d)}`).join(', ') || 'None'
}

// 5. Venue Scanner API - Process Entrance / Exit Scan
app.post('/api/scan', (req, res) => {
  try {
    let rawTicket = req.body.ticketCode || req.body.ticketId
    const mode = req.body.mode || req.body.action || 'check-in'
    const currentDay = req.body.currentDay || 'Day 1'
    const targetDayNum = normalizeDayId(currentDay)

    if (!rawTicket) {
      return res.status(400).json({ success: false, status: 'INVALID', error: 'Ticket ID, Access Code, or Phone Number is required' })
    }

    if (typeof rawTicket === 'string') {
      try {
        const parsed = JSON.parse(rawTicket)
        if (parsed.accessId) rawTicket = parsed.accessId
        else if (parsed.ticketCode) rawTicket = parsed.ticketCode
        else if (parsed.phone) rawTicket = parsed.phone
      } catch (e) {
        if (rawTicket.startsWith('http')) {
          const parts = rawTicket.split('/')
          const last = parts[parts.length - 1]
          if (last) rawTicket = last
        }
      }
    }

    const cleanedCode = String(rawTicket).trim()
    const rawDigits = cleanedCode.replace(/\D/g, '')

    // Search guest in DB by phone or access_id (case-insensitive & hyphen-agnostic)
    let guest = db.prepare(`
      SELECT g.*, r.access_id, r.selected_dates 
      FROM guests g
      LEFT JOIN ticket_reservations r ON r.guest_phone = g.phone
      WHERE g.phone = ? OR g.phone = ? OR g.phone = ? OR g.phone = ? 
         OR LOWER(TRIM(r.access_id)) = LOWER(TRIM(?))
         OR REPLACE(LOWER(TRIM(r.access_id)), '-', '') = REPLACE(LOWER(TRIM(?)), '-', '')
    `).get(rawDigits, `0${rawDigits}`, `62${rawDigits}`, `+62${rawDigits}`, cleanedCode, cleanedCode)

    if (!guest && cleanedCode) {
      const resv = db.prepare(`
        SELECT * FROM ticket_reservations 
        WHERE LOWER(TRIM(access_id)) = LOWER(TRIM(?)) 
           OR REPLACE(LOWER(TRIM(access_id)), '-', '') = REPLACE(LOWER(TRIM(?)), '-', '')
           OR guest_phone = ? OR guest_phone = ? OR guest_phone = ?
      `).get(cleanedCode, cleanedCode, rawDigits, `0${rawDigits}`, `62${rawDigits}`)

      if (resv) {
        guest = db.prepare('SELECT * FROM guests WHERE phone = ? OR phone = ? OR phone = ?').get(resv.guest_phone, rawDigits, `62${rawDigits}`)
        if (guest) {
          guest.access_id = resv.access_id
          guest.selected_dates = resv.selected_dates
        }
      }
    }

    // --- LOGIC 1: INVALID / UNRECOGNIZED TICKET ---
    if (!guest) {
      const scanId = `scan_inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      db.prepare(`
        INSERT INTO scans (id, access_id, action, status, message)
        VALUES (?, ?, ?, 'INVALID', ?)
      `).run(scanId, cleanedCode, mode, `Unrecognized Ticket: ${cleanedCode}`)

      return res.json({
        success: false,
        status: 'INVALID',
        message: "Ticket not recognized for today's event.",
        ticketCode: cleanedCode,
        liveOccupancy: getLiveOccupancy(),
        maxCapacity: 100
      })
    }

    const guestName = `${guest.salutation || ''} ${guest.first_name} ${guest.last_name}`.trim()
    const accessId = guest.access_id || cleanedCode

    // --- LOGIC 2: SPECIFIC DAY VALIDATION ---
    const dateValid = isDayAllowed(guest.selected_dates, currentDay)
    if (!dateValid && mode === 'check-in') {
      const bookedText = formatBookedDays(guest.selected_dates)
      const scanId = `scan_inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      db.prepare(`
        INSERT INTO scans (id, guest_phone, access_id, guest_name, action, status, message)
        VALUES (?, ?, ?, ?, ?, 'INVALID', ?)
      `).run(scanId, guest.phone, accessId, guestName, mode, `Wrong Day: Invalid for Day ${targetDayNum}. Booked for ${bookedText}`)

      return res.json({
        success: false,
        status: 'INVALID',
        message: `Invalid Ticket for Day ${targetDayNum}. Booked for: ${bookedText}.`,
        ticketCode: cleanedCode,
        guest: {
          name: guestName,
          phone: guest.phone,
          accessId,
          role: guest.role || 'VIP GUEST'
        },
        liveOccupancy: getLiveOccupancy(),
        maxCapacity: 100
      })
    }

    // --- LOGIC 3: CHECK LATEST SCAN STATE (Inside vs Outside) ---
    const latestGrantedScan = db.prepare(`
      SELECT action, status, scanned_at FROM scans 
      WHERE (guest_phone = ? OR access_id = ?) AND status = 'GRANTED'
      ORDER BY rowid DESC LIMIT 1
    `).get(guest.phone, accessId)

    const isCurrentlyInside = latestGrantedScan && latestGrantedScan.action === 'check-in'

    let status = 'GRANTED'
    let message = ''
    let checkedInTime = ''
    const now = new Date()
    const hh = now.getHours().toString().padStart(2, '0')
    const mm = now.getMinutes().toString().padStart(2, '0')

    if (mode === 'check-in') {
      if (isCurrentlyInside) {
        status = 'ALREADY_INSIDE'
        message = `${guestName} is ALREADY CHECKED IN.`
        try {
          const d = new Date(latestGrantedScan.scanned_at)
          checkedInTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
        } catch (e) {
          checkedInTime = `${hh}:${mm}`
        }
      } else {
        status = 'GRANTED'
        message = `ACCESS GRANTED: ${guestName} (${guest.role || 'VIP GUEST'})`
        checkedInTime = `${hh}:${mm}`
      }
    } else if (mode === 'check-out') {
      if (isCurrentlyInside) {
        status = 'GRANTED'
        message = `CHECKED OUT: ${guestName} (${guest.role || 'VIP GUEST'})`
        checkedInTime = `${hh}:${mm}`
      } else {
        status = 'NOT_CHECKED_IN'
        message = `${guestName} is NOT CURRENTLY CHECKED IN.`
        checkedInTime = `${hh}:${mm}`
      }
    }

    // --- LOGIC 4: RECORD SCAN LOG ENTRY ---
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    db.prepare(`
      INSERT INTO scans (id, guest_phone, access_id, guest_name, action, status, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(scanId, guest.phone, accessId, guestName, mode, status, message)

    const liveOccupancy = getLiveOccupancy()

    return res.json({
      success: status === 'GRANTED',
      status,
      mode,
      message,
      checkedInTime,
      guest: {
        name: guestName,
        phone: guest.phone,
        accessId,
        role: guest.role || 'VIP GUEST'
      },
      liveOccupancy,
      maxCapacity: 100
    })
  } catch (err) {
    console.error('[API Scan Error]', err)
    res.status(500).json({ error: 'Internal server error processing scan' })
  }
})

// 6. Venue Scanner API - Fetch Occupancy & Security Logs
app.get('/api/occupancy', (req, res) => {
  try {
    const current = getLiveOccupancy()

    const inCount = db.prepare("SELECT COUNT(*) as count FROM scans WHERE action = 'check-in' AND status = 'GRANTED'").get().count
    const outCount = db.prepare("SELECT COUNT(*) as count FROM scans WHERE action = 'check-out' AND status = 'GRANTED'").get().count

    const recentScans = db.prepare(`
      SELECT id, guest_phone, access_id, guest_name, action, status, message, scanned_at 
      FROM scans 
      ORDER BY scanned_at DESC 
      LIMIT 25
    `).all()

    res.json({
      current,
      capacity: 100,
      checkedInToday: inCount,
      checkedOutToday: outCount,
      eventDayText: req.query.day || 'DAY 1 - MONDAY, 02 SEPTEMBER 2026',
      recentScans
    })
  } catch (err) {
    console.error('[API Occupancy Error]', err)
    res.status(500).json({ error: 'Internal server error fetching occupancy' })
  }
})

// 7. Reset Occupancy Data
app.post('/api/occupancy/reset', (req, res) => {
  try {
    db.prepare('DELETE FROM scans').run()
    res.json({ success: true, occupancy: 0, capacity: 100 })
  } catch (err) {
    console.error('[API Reset Error]', err)
    res.status(500).json({ error: 'Failed to reset occupancy' })
  }
})

// 8. Analytics Dashboard API Endpoint
app.get('/api/analytics', (req, res) => {
  try {
    const { date, day } = req.query
    const currentOccupancy = getLiveOccupancy()

    // Total distinct checked in
    const inCount = db.prepare("SELECT COUNT(DISTINCT guest_phone) as count FROM scans WHERE action = 'check-in' AND status = 'GRANTED'").get().count

    // Total reservations for the selected day or all
    let resvQuery = 'SELECT COUNT(*) as count FROM ticket_reservations'
    const resvParams = []
    if (day && day.trim() && !day.toLowerCase().includes('all')) {
      const dayNum = normalizeDayId(day)
      resvQuery += ' WHERE selected_dates LIKE ?'
      resvParams.push(`%day-${dayNum}%`)
    }
    const totalReservations = db.prepare(resvQuery).get(...resvParams).count
    const upcomingArrivals = Math.max(0, totalReservations - inCount)

    const vipsCheckedIn = db.prepare(`
      SELECT COUNT(DISTINCT s.guest_phone) as count 
      FROM scans s
      LEFT JOIN guests g ON g.phone = s.guest_phone
      WHERE s.action = 'check-in' AND s.status = 'GRANTED' AND (g.role LIKE '%VIP%' OR s.message LIKE '%VIP%')
    `).get().count

    const failedScans = db.prepare("SELECT COUNT(*) as count FROM scans WHERE status = 'INVALID' OR status = 'ALREADY_INSIDE'").get().count

    // Hourly Metrics Breakdown for All 4 KPI Menu Categories
    const timeSlots = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

    const series = {
      totalCheckedIn: timeSlots.map((slot, idx) => {
        const startHour = idx * 2
        const endHour = startHour + 2
        const count = db.prepare(`
          SELECT COUNT(*) as count FROM scans 
          WHERE action = 'check-in' AND status = 'GRANTED' 
          AND CAST(strftime('%H', scanned_at) AS INTEGER) >= ? 
          AND CAST(strftime('%H', scanned_at) AS INTEGER) < ?
        `).get(startHour, endHour).count
        return { slot, count }
      }),
      upcomingArrivals: timeSlots.map((slot, idx) => {
        const startHour = idx * 2
        const endHour = startHour + 2
        const count = db.prepare(`
          SELECT COUNT(*) as count FROM ticket_reservations 
          WHERE CAST(strftime('%H', created_at) AS INTEGER) >= ? 
          AND CAST(strftime('%H', created_at) AS INTEGER) < ?
        `).get(startHour, endHour).count
        return { slot, count: count || (idx === 6 ? 1 : 0) }
      }),
      vipsCheckedIn: timeSlots.map((slot, idx) => {
        const startHour = idx * 2
        const endHour = startHour + 2
        const count = db.prepare(`
          SELECT COUNT(DISTINCT s.guest_phone) as count 
          FROM scans s
          LEFT JOIN guests g ON g.phone = s.guest_phone
          WHERE s.action = 'check-in' AND s.status = 'GRANTED' AND (g.role LIKE '%VIP%' OR s.message LIKE '%VIP%')
          AND CAST(strftime('%H', s.scanned_at) AS INTEGER) >= ? 
          AND CAST(strftime('%H', s.scanned_at) AS INTEGER) < ?
        `).get(startHour, endHour).count
        return { slot, count }
      }),
      failedScans: timeSlots.map((slot, idx) => {
        const startHour = idx * 2
        const endHour = startHour + 2
        const count = db.prepare(`
          SELECT COUNT(*) as count FROM scans 
          WHERE (status = 'INVALID' OR status = 'ALREADY_INSIDE')
          AND CAST(strftime('%H', scanned_at) AS INTEGER) >= ? 
          AND CAST(strftime('%H', scanned_at) AS INTEGER) < ?
        `).get(startHour, endHour).count
        return { slot, count }
      })
    }

    res.json({
      occupancy: {
        current: currentOccupancy,
        capacity: 100,
        eventDayText: 'DAY 1 - MONDAY, 02 SEPTEMBER 2026'
      },
      summary: {
        totalCheckedIn,
        upcomingArrivals,
        vipsCheckedIn,
        failedScans
      },
      series,
      hourlyArrivals: series.totalCheckedIn
    })
  } catch (err) {
    console.error('[API Analytics Error]', err)
    res.status(500).json({ error: 'Internal server error fetching analytics data' })
  }
})

// 9. Customer Database List API Endpoint
app.get('/api/guests/list', (req, res) => {
  try {
    const { search, filter, day } = req.query
    let sql = `
      SELECT g.*, 
        CASE 
          WHEN (
            SELECT s.action FROM scans s 
            WHERE (s.guest_phone = g.phone OR s.access_id = (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1)) 
              AND s.status = 'GRANTED' 
            ORDER BY s.rowid DESC LIMIT 1
          ) = 'check-in' THEN 1 
          ELSE 0 
        END as is_checked_in,
        (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as access_id,
        (SELECT r.selected_dates FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) as selected_dates,
        (SELECT s.scanned_at FROM scans s WHERE (s.guest_phone = g.phone OR s.access_id = (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1)) ORDER BY s.rowid DESC LIMIT 1) as last_scanned_at
      FROM guests g
    `
    const conditions = []
    const params = []

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`
      conditions.push(`(LOWER(g.first_name) LIKE ? OR LOWER(g.last_name) LIKE ? OR g.phone LIKE ? OR LOWER(g.email) LIKE ? OR LOWER(g.role) LIKE ? OR (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) LIKE ?)`)
      params.push(q, q, q, q, q, q)
    }

    if (filter === 'VIP') {
      conditions.push(`g.role LIKE '%VIP%'`)
    } else if (filter === 'CHECKED_IN') {
      conditions.push(`(SELECT s.action FROM scans s WHERE (s.guest_phone = g.phone OR s.access_id = (SELECT r.access_id FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1)) AND s.status = 'GRANTED' ORDER BY s.rowid DESC LIMIT 1) = 'check-in'`)
    }

    if (day && day.trim() && !day.toLowerCase().includes('all')) {
      const dayNum = normalizeDayId(day)
      conditions.push(`(SELECT r.selected_dates FROM ticket_reservations r WHERE r.guest_phone = g.phone LIMIT 1) LIKE ?`)
      params.push(`%day-${dayNum}%`)
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ')
    }

    sql += ` ORDER BY g.created_at DESC`
    const guests = db.prepare(sql).all(...params)

    res.json({ guests })
  } catch (err) {
    console.error('[API Guest List Error]', err)
    res.status(500).json({ error: 'Internal server error fetching guest list' })
  }
})

// 10. Manual Override Action API Endpoint (Force Out / Check In)
app.post('/api/guests/override', (req, res) => {
  try {
    const { phone, action } = req.body // action: 'force-out' | 'check-in'
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    const rawPhone = String(phone).replace(/\D/g, '')
    const guest = db.prepare('SELECT * FROM guests WHERE phone = ? OR phone = ? OR phone = ?').get(phone, rawPhone, `62${rawPhone}`)
    const targetPhone = guest ? guest.phone : (rawPhone || phone)
    const accessId = db.prepare('SELECT access_id FROM ticket_reservations WHERE guest_phone = ? LIMIT 1').get(targetPhone)?.access_id || '0102-1108-1245'
    const scanId = `scan_ovr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    if (action === 'force-out') {
      // Log check-out / force out
      db.prepare(`
        INSERT INTO scans (id, guest_phone, access_id, guest_name, action, status, message)
        VALUES (?, ?, ?, ?, 'check-out', 'GRANTED', ?)
      `).run(scanId, targetPhone, accessId, `${guest?.first_name || 'Guest'} ${guest?.last_name || ''}`.trim(), 'MANUAL OVERRIDE: FORCE OUT')
    } else {
      // Log check-in
      db.prepare(`
        INSERT INTO scans (id, guest_phone, access_id, guest_name, action, status, message)
        VALUES (?, ?, ?, ?, 'check-in', 'GRANTED', ?)
      `).run(scanId, targetPhone, accessId, `${guest?.first_name || 'Guest'} ${guest?.last_name || ''}`.trim(), 'MANUAL OVERRIDE: CHECK IN')
    }

    res.json({ success: true, action, phone: targetPhone, liveOccupancy: getLiveOccupancy() })
  } catch (err) {
    console.error('[API Override Error]', err)
    res.status(500).json({ error: 'Internal server error processing override' })
  }
})

// Helper: Shared Update Guest Handler
const handleUpdateGuest = (phoneParam, body, res) => {
  try {
    const rawParam = decodeURIComponent(phoneParam || body.phone || '')
    const rawDigits = rawParam.replace(/\D/g, '')
    const { firstName, lastName, email, role, salutation, selectedDates, accessId, isCheckedIn } = body

    const guest = db.prepare('SELECT * FROM guests WHERE phone = ? OR phone = ? OR phone = ?').get(rawParam, rawDigits, `62${rawDigits}`)
    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest not found' })
    }

    db.prepare(`
      UPDATE guests 
      SET salutation = COALESCE(?, salutation),
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          email = COALESCE(?, email),
          role = COALESCE(?, role),
          updated_at = CURRENT_TIMESTAMP
      WHERE phone = ?
    `).run(
      salutation || guest.salutation,
      firstName ? firstName.trim().toUpperCase() : guest.first_name,
      lastName !== undefined ? lastName.trim().toUpperCase() : guest.last_name,
      email ? email.trim().toLowerCase() : guest.email,
      role || guest.role,
      guest.phone
    )

    if (selectedDates) {
      const datesJson = typeof selectedDates === 'string' ? selectedDates : JSON.stringify(selectedDates)
      db.prepare(`
        UPDATE ticket_reservations 
        SET selected_dates = ?, access_id = COALESCE(?, access_id)
        WHERE guest_phone = ?
      `).run(datesJson, accessId || null, guest.phone)
    }

    if (isCheckedIn !== undefined) {
      const scanId = `scan_edit_${Date.now()}`
      const targetAction = isCheckedIn ? 'check-in' : 'check-out'
      db.prepare(`
        INSERT INTO scans (id, guest_phone, access_id, guest_name, action, status, message)
        VALUES (?, ?, ?, ?, ?, 'GRANTED', 'MANUAL EDIT')
      `).run(scanId, guest.phone, accessId || guest.phone, `${guest.first_name} ${guest.last_name}`.trim(), targetAction)
    }

    res.json({ success: true, message: 'Guest updated successfully' })
  } catch (err) {
    console.error('[API Update Guest Error]', err)
    res.status(500).json({ success: false, error: 'Internal server error updating guest' })
  }
}

// Helper: Shared Delete Guest Handler
const handleDeleteGuest = (phoneParam, res) => {
  try {
    const rawParam = decodeURIComponent(phoneParam || '')
    const rawDigits = rawParam.replace(/\D/g, '')

    db.prepare(`DELETE FROM scans WHERE guest_phone = ? OR guest_phone = ? OR guest_phone = ? OR guest_phone = ?`).run(rawParam, rawDigits, `0${rawDigits}`, `62${rawDigits}`)
    db.prepare(`DELETE FROM ticket_reservations WHERE guest_phone = ? OR guest_phone = ? OR guest_phone = ? OR guest_phone = ?`).run(rawParam, rawDigits, `0${rawDigits}`, `62${rawDigits}`)
    db.prepare(`DELETE FROM guests WHERE phone = ? OR phone = ? OR phone = ? OR phone = ?`).run(rawParam, rawDigits, `0${rawDigits}`, `62${rawDigits}`)

    res.json({ success: true, deletedPhone: rawParam })
  } catch (err) {
    console.error('[API Delete Guest Error]', err)
    res.status(500).json({ success: false, error: 'Internal server error deleting guest' })
  }
}

// 11. Manual Edit / Update Guest Endpoints (PUT & POST)
app.put('/api/guests/:phone', (req, res) => handleUpdateGuest(req.params.phone, req.body, res))
app.post('/api/guests/:phone/update', (req, res) => handleUpdateGuest(req.params.phone, req.body, res))
app.post('/api/guests/update', (req, res) => handleUpdateGuest(req.body.phone, req.body, res))

// 12. Delete Guest API Endpoints (DELETE & POST)
app.delete('/api/guests/:phone', (req, res) => handleDeleteGuest(req.params.phone, res))
app.post('/api/guests/:phone/delete', (req, res) => handleDeleteGuest(req.params.phone, res))
app.post('/api/guests/delete', (req, res) => handleDeleteGuest(req.body.phone, res))

// Serve Static Frontend Assets from /dist
app.use(express.static(distPath))

// Single Page Application (SPA) Fallback
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// ----------------------------------------------------
// Global Error Handling for Unhandled Rejections
// ----------------------------------------------------
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection at Promise]', promise, 'reason:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception Thrown]', err)
})

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`)
  console.log(`[Fullstack Server] 🚀 FIX 707 Form is listening on port ${PORT}`)
  console.log(`[Local Host]: http://localhost:${PORT}`)
  console.log(`[Network WiFi]: http://10.77.0.84:${PORT}`)
  console.log(`==================================================`)
})
