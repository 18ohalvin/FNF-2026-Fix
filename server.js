import express from 'express'
import path from 'path'
import crypto from 'crypto'
import cors from 'cors'
import dotenv from 'dotenv'
import db, { normalizePhoneNumber, normalizeDayId } from './src/server/db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 7070
const distPath = path.resolve(process.cwd(), 'dist')

// Middleware
app.use(cors())
app.use(express.json())

// Request logger for diagnostic tracing
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`[API Request] ${req.method} ${req.url}`)
  }
  next()
})

// ----------------------------------------------------
// Staff Auth: PIN login -> HMAC-signed stateless session token
// ----------------------------------------------------
const STAFF_STORE_ID = process.env.STAFF_STORE_ID
const STAFF_PIN = process.env.STAFF_PIN
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const AUTH_SECRET = `${STAFF_PIN}_${STAFF_STORE_ID}_707_SALT_2026`

if (!STAFF_STORE_ID || !STAFF_PIN) {
  console.error('[FATAL] STAFF_STORE_ID and STAFF_PIN env vars must be set — refusing to start without staff credentials configured.')
  process.exit(1)
}

const revokedTokens = new Set()

export function generateStaffToken() {
  const ts = Date.now().toString(36)
  const rand = crypto.randomBytes(8).toString('hex')
  const payload = `${ts}.${rand}`
  const hmac = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex').substring(0, 32)
  return `${payload}.${hmac}`
}

export function verifyStaffToken(token) {
  if (!token || revokedTokens.has(token)) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [ts, rand, sig] = parts
  const payload = `${ts}.${rand}`
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex').substring(0, 32)
  if (sig !== expectedSig) return false
  const timestamp = parseInt(ts, 36)
  if (isNaN(timestamp) || Date.now() - timestamp > SESSION_TTL_MS) return false
  return true
}

export function requireStaffAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || !verifyStaffToken(token)) {
    return res.status(401).json({ error: 'Unauthorized: staff login required' })
  }

  next()
}

app.post('/api/staff/login', (req, res) => {
  const { storeId, pin } = req.body || {}

  if (storeId !== STAFF_STORE_ID || pin !== STAFF_PIN) {
    return res.status(401).json({ success: false, error: 'Invalid Store ID or PIN. Please check your credentials.' })
  }

  const token = generateStaffToken()
  res.json({ success: true, token })
})

app.post('/api/staff/logout', (req, res) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) revokedTokens.add(token)
  res.json({ success: true })
})

// ----------------------------------------------------
// Helper Functions
// ----------------------------------------------------

// Generate 3-digit unique alphanumeric Access ID (excluding ambiguous 0, O, 1, I, L)
function generateShortAccessId(length = 3) {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Check if booked dates contain the target event day
function isDayAllowed(bookedDates, targetDay) {
  if (!bookedDates || (Array.isArray(bookedDates) && bookedDates.length === 0)) {
    return true
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

  return datesArr.some(d => normalizeDayId(d) === targetNum)
}

// Format booked days for user-friendly messages (e.g. "Day 1, Day 2")
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

// ----------------------------------------------------
// REST API Routes
// ----------------------------------------------------

// 1. Health Probe
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    databaseDriver: db.driverType,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
})

// 2. Check Phone Number Endpoint (Temporarily Bypass Member Sync)
app.post('/api/check-phone', async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    const rawDigits = normalizePhoneNumber(phone)

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
  } catch (err) {
    console.error('[API Check Phone Error]', err)
    res.status(500).json({ error: 'Internal server error checking phone number' })
  }
})

// 3. Upsert Guest Profile
app.post('/api/guests', async (req, res) => {
  try {
    const phone = req.body.phone
    const firstName = req.body.firstName || req.body.first_name || 'GUEST'
    const lastName = req.body.lastName || req.body.last_name || ''
    const email = req.body.email || 'guest@707.co.id'
    const salutation = req.body.salutation || 'Mr.'
    const instagram = req.body.instagram || ''
    const role = req.body.role || 'VIP GUEST'

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    const result = await db.upsertGuest({
      phone,
      salutation,
      firstName,
      lastName,
      email,
      instagram,
      role
    })

    res.json({ success: true, message: 'Guest details saved successfully', phone: result.phone })
  } catch (err) {
    console.error('[API Save Guest Error]', err)
    res.status(500).json({ error: 'Internal server error saving guest details' })
  }
})

// 4. Create Reservation Endpoint (Simplified Short Access IDs)
app.post('/api/reservations', async (req, res) => {
  try {
    let { phone, accessId, selectedDates } = req.body

    if (!phone || !selectedDates) {
      return res.status(400).json({ error: 'Missing required reservation parameters' })
    }

    if (!accessId || accessId.length > 8 || accessId.includes('-')) {
      accessId = generateShortAccessId(3)
    }

    const result = await db.createReservation({
      phone,
      accessId,
      selectedDates
    })

    res.json(result)
  } catch (err) {
    console.error('[API Reservation Error]', err)
    res.status(500).json({ error: 'Internal server error creating reservation' })
  }
})

// 5. Venue Scanner API - Process Entrance / Exit Scan
app.post('/api/scan', requireStaffAuth, async (req, res) => {
  try {
    let rawTicket = req.body.ticketCode || req.body.ticketId || req.body.ticket || req.body.code || req.body.accessId || req.body.phone
    const mode = req.body.mode || req.body.action || 'check-in'
    const currentDay = req.body.currentDay || req.body.eventDay || req.body.day || 'Day 1'
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
    
    // Find matching reservation & guest
    let record = await db.getReservationByAccessId(cleanedCode)
    if (!record) {
      const guestOnly = await db.getGuestByPhone(cleanedCode)
      if (guestOnly) {
        const resv = await db.getReservationByPhone(guestOnly.phone)
        record = {
          ...guestOnly,
          access_id: resv?.access_id || cleanedCode,
          selected_dates: resv?.selected_dates || JSON.stringify(['day-1'])
        }
      }
    }

    // --- LOGIC 1: INVALID / UNRECOGNIZED TICKET ---
    if (!record) {
      await db.recordScan({
        accessId: cleanedCode,
        action: mode,
        status: 'INVALID',
        message: `Unrecognized Ticket: ${cleanedCode}`,
        eventDay: `day-${targetDayNum}`
      })

      const liveOccupancy = await db.getLiveOccupancy()
      return res.json({
        success: false,
        status: 'INVALID',
        message: "Ticket not recognized for today's event.",
        ticketCode: cleanedCode,
        liveOccupancy,
        maxCapacity: 100
      })
    }

    const guestName = `${record.salutation || ''} ${record.first_name || ''} ${record.last_name || ''}`.trim() || 'VIP GUEST'
    const accessId = record.access_id || cleanedCode
    const guestPhone = record.phone || record.guest_phone

    // --- LOGIC 2: SPECIFIC DAY VALIDATION ---
    const dateValid = isDayAllowed(record.selected_dates, currentDay)
    if (!dateValid && mode === 'check-in') {
      const bookedText = formatBookedDays(record.selected_dates)
      await db.recordScan({
        guestPhone,
        accessId,
        guestName,
        action: mode,
        status: 'INVALID',
        message: `Wrong Day: Invalid for Day ${targetDayNum}. Booked for ${bookedText}`,
        eventDay: `day-${targetDayNum}`
      })

      const liveOccupancy = await db.getLiveOccupancy()
      return res.json({
        success: false,
        status: 'INVALID',
        message: `Invalid Ticket for Day ${targetDayNum}. Booked for: ${bookedText}.`,
        ticketCode: cleanedCode,
        guest: {
          name: guestName,
          phone: guestPhone,
          accessId,
          role: record.role || 'VIP GUEST'
        },
        liveOccupancy,
        maxCapacity: 100
      })
    }

    // --- LOGIC 3: CHECK LATEST SCAN STATE (Inside vs Outside) ---
    const latestGrantedScan = await db.getLatestGrantedScan(guestPhone, accessId)
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
        message = `ACCESS GRANTED: ${guestName} (${record.role || 'VIP GUEST'})`
        checkedInTime = `${hh}:${mm}`
      }
    } else if (mode === 'check-out') {
      if (isCurrentlyInside) {
        status = 'GRANTED'
        message = `CHECKED OUT: ${guestName} (${record.role || 'VIP GUEST'})`
        checkedInTime = `${hh}:${mm}`
      } else {
        status = 'NOT_CHECKED_IN'
        message = `${guestName} is NOT CURRENTLY CHECKED IN.`
        checkedInTime = `${hh}:${mm}`
      }
    }

    // --- LOGIC 4: RECORD SCAN LOG ENTRY ---
    await db.recordScan({
      guestPhone,
      accessId,
      guestName,
      action: mode,
      status,
      message,
      eventDay: `day-${targetDayNum}`
    })

    const liveOccupancy = await db.getLiveOccupancy()

    return res.json({
      success: status === 'GRANTED',
      status,
      mode,
      message,
      checkedInTime,
      guest: {
        name: guestName,
        phone: guestPhone,
        accessId,
        role: record.role || 'VIP GUEST'
      },
      liveOccupancy,
      maxCapacity: await db.getMaxCapacity()
    })
  } catch (err) {
    console.error('[API Scan Error]', err)
    res.status(500).json({ error: 'Internal server error processing scan' })
  }
})

// 6. Venue Scanner API - Fetch Occupancy & Security Logs
app.get('/api/occupancy', requireStaffAuth, async (req, res) => {
  try {
    const stats = await db.getOccupancyStats(req.query.day)
    res.json(stats)
  } catch (err) {
    console.error('[API Occupancy Error]', err)
    res.status(500).json({ error: 'Internal server error fetching occupancy' })
  }
})

// 7. Adjust Venue Max Capacity (1 - 10,000)
app.post('/api/occupancy/capacity', requireStaffAuth, async (req, res) => {
  try {
    const { capacity } = req.body
    const capNum = parseInt(capacity, 10)
    if (isNaN(capNum) || capNum < 1 || capNum > 10000) {
      return res.status(400).json({ error: 'Capacity must be an integer between 1 and 10,000' })
    }
    const saved = await db.setMaxCapacity(capNum)
    res.json({ success: true, capacity: saved })
  } catch (err) {
    console.error('[API Update Capacity Error]', err)
    res.status(500).json({ error: 'Failed to update max capacity' })
  }
})

// 8. Reset Occupancy Data
app.post('/api/occupancy/reset', requireStaffAuth, async (req, res) => {
  try {
    await db.resetOccupancy()
    const cap = await db.getMaxCapacity()
    res.json({ success: true, occupancy: 0, capacity: cap })
  } catch (err) {
    console.error('[API Reset Error]', err)
    res.status(500).json({ error: 'Failed to reset occupancy' })
  }
})

// 8. Analytics Dashboard API Endpoint
app.get('/api/analytics', requireStaffAuth, async (req, res) => {
  try {
    const analytics = await db.getAnalyticsData(req.query.day || req.query.date)
    res.json(analytics)
  } catch (err) {
    console.error('[API Analytics Error]', err)
    res.status(500).json({ error: 'Internal server error fetching analytics data' })
  }
})

// 9. Customer Database List API Endpoint
app.get('/api/guests/list', requireStaffAuth, async (req, res) => {
  try {
    const { search, filter, day } = req.query
    const guests = await db.getGuestsList({ search, filter, day })
    res.json({ guests })
  } catch (err) {
    console.error('[API Guest List Error]', err)
    res.status(500).json({ error: 'Internal server error fetching guest list' })
  }
})

// 10. Manual Override Action API Endpoint (Force Out / Check In)
app.post('/api/guests/override', requireStaffAuth, async (req, res) => {
  try {
    const { phone, action } = req.body // action: 'force-out' | 'check-in'
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    const guest = await db.getGuestByPhone(phone)
    if (!guest) {
      return res.status(404).json({ success: false, error: 'Override Failed: Phone number not found.' })
    }

    const targetPhone = guest.phone
    const resv = await db.getReservationByPhone(targetPhone)
    const accessId = resv ? resv.access_id : targetPhone
    const guestFullName = `${guest.first_name || 'Guest'} ${guest.last_name || ''}`.trim()

    const scanAction = action === 'force-out' ? 'check-out' : 'check-in'
    const scanMessage = action === 'force-out' ? 'MANUAL OVERRIDE: FORCE OUT' : 'MANUAL OVERRIDE: CHECK IN'

    await db.recordScan({
      guestPhone: targetPhone,
      accessId,
      guestName: guestFullName,
      action: scanAction,
      status: 'GRANTED',
      message: scanMessage
    })

    const liveOccupancy = await db.getLiveOccupancy()
    res.json({ success: true, action, phone: targetPhone, liveOccupancy })
  } catch (err) {
    console.error('[API Override Error]', err)
    res.status(500).json({ success: false, error: 'Internal server error processing override' })
  }
})

// Helper: Shared Update Guest Handler
const handleUpdateGuest = async (phoneParam, body, res) => {
  try {
    const rawParam = decodeURIComponent(phoneParam || body.phone || '')
    const result = await db.updateGuest(rawParam, body)
    if (!result) {
      return res.status(404).json({ success: false, error: 'Guest not found' })
    }

    if (body.isCheckedIn !== undefined) {
      const targetAction = body.isCheckedIn ? 'check-in' : 'check-out'
      await db.recordScan({
        guestPhone: result.phone,
        accessId: body.accessId || result.phone,
        guestName: `${result.first_name} ${result.last_name}`.trim(),
        action: targetAction,
        status: 'GRANTED',
        message: 'MANUAL EDIT'
      })
    }

    res.json({ success: true, message: 'Guest updated successfully' })
  } catch (err) {
    console.error('[API Update Guest Error]', err)
    res.status(500).json({ success: false, error: 'Internal server error updating guest' })
  }
}

// Helper: Shared Delete Guest Handler
const handleDeleteGuest = async (phoneParam, res) => {
  try {
    const rawParam = decodeURIComponent(phoneParam || '')
    const deleted = await db.deleteGuest(rawParam)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Guest not found' })
    }
    res.json({ success: true, deletedPhone: rawParam })
  } catch (err) {
    console.error('[API Delete Guest Error]', err)
    res.status(500).json({ success: false, error: 'Internal server error deleting guest' })
  }
}

// 11. Manual Edit / Update Guest Endpoints (PUT & POST)
app.put('/api/guests/:phone', requireStaffAuth, (req, res) => handleUpdateGuest(req.params.phone, req.body, res))
app.post('/api/guests/:phone/update', requireStaffAuth, (req, res) => handleUpdateGuest(req.params.phone, req.body, res))
app.post('/api/guests/update', requireStaffAuth, (req, res) => handleUpdateGuest(req.body.phone, req.body, res))

// 12. Delete Guest API Endpoints (DELETE & POST)
app.delete('/api/guests/:phone', requireStaffAuth, (req, res) => handleDeleteGuest(req.params.phone, res))
app.post('/api/guests/:phone/delete', requireStaffAuth, (req, res) => handleDeleteGuest(req.params.phone, res))
app.post('/api/guests/delete', requireStaffAuth, (req, res) => handleDeleteGuest(req.body.phone, res))

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
  console.log(`[Database Adapter]: ${db.driverType.toUpperCase()}`)
  console.log(`[Local Host]: http://localhost:${PORT}`)
  console.log(`[Network WiFi]: http://10.77.0.84:${PORT}`)
  console.log(`==================================================`)
})
