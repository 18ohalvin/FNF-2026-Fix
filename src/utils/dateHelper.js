/**
 * Shared Helper for Event Date Calculation based on GMT+7 (Asia/Jakarta / WIB) internet time.
 * Maximum capacity: 25 per time slot.
 * User quota: Up to 2 time slots per day (max 4 slots across the 2-day event).
 */

export const MAX_SLOT_CAPACITY = 25
export const MAX_SLOTS_PER_DAY = 2

export const EVENT_ARRIVAL_SLOTS = [
  // ----------------------------------------------------
  // 19 September 2026 (Saturday)
  // ----------------------------------------------------
  { id: '19sep-1030', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '10:30 - 11:00', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1100', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '11:00 - 11:30', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1130', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '11:30 - 12:00', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1200', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '12:00 - 12:30', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1230', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '12:30 - 13:00', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1300', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '13:00 - 13:30', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1330', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '13:30 - 14:00', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1400', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '14:00 - 14:30', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1430', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '14:30 - 15:00', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1500', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '15:00 - 15:30', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1530', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '15:30 - 16:00', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1600', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '16:00 - 16:30', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-1630', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '16:30 - 17:00', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-2000', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '20:00 - 20:30', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-2030', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '20:30 - 21:00', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-2100', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '21:00 - 21:30', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },
  { id: '19sep-2130', dateId: '19-sep', date: '19 September 2026', dateIso: '2026-09-19', time: '21:30 - 22:00', session: '', sessionSub: '', dayNum: '1', dayLabel: 'Day 1' },

  // ----------------------------------------------------
  // 20 September 2026 (Sunday)
  // ----------------------------------------------------
  { id: '20sep-1030', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '10:30 - 11:00', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1100', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '11:00 - 11:30', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1130', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '11:30 - 12:00', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1200', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '12:00 - 12:30', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1230', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '12:30 - 13:00', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1300', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '13:00 - 13:30', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1330', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '13:30 - 14:00', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1400', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '14:00 - 14:30', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1430', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '14:30 - 15:00', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1500', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '15:00 - 15:30', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1530', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '15:30 - 16:00', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1600', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '16:00 - 16:30', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1630', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '16:30 - 17:00', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1700', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '17:00 - 18:00', session: 'GUIDED SESSION', sessionSub: 'Led by Dea Barandana', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1800', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '18:00 - 19:00', session: 'GUIDED SESSION', sessionSub: 'Led by Nina Nikicio', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-1900', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '19:00 - 20:00', session: 'GUIDED SESSION', sessionSub: 'Led by Nina Nikicio', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-2000', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '20:00 - 20:30', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-2030', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '20:30 - 21:00', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-2100', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '21:00 - 21:30', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' },
  { id: '20sep-2130', dateId: '20-sep', date: '20 September 2026', dateIso: '2026-09-20', time: '21:30 - 22:00', session: '', sessionSub: '', dayNum: '2', dayLabel: 'Day 2' }
]

export const EVENT_DATE_GROUPS = [
  {
    id: '19-sep',
    date: '19 SEPTEMBER 2026',
    dateIso: '2026-09-19',
    subtitle: 'Live guided session',
    slots: EVENT_ARRIVAL_SLOTS.filter(s => s.dateId === '19-sep')
  },
  {
    id: '20-sep',
    date: '20 SEPTEMBER 2026',
    dateIso: '2026-09-20',
    subtitle: 'Live guided session',
    slots: EVENT_ARRIVAL_SLOTS.filter(s => s.dateId === '20-sep')
  }
]

export function getSlotById(id) {
  if (!id) return null
  const cleaned = String(id).trim().toLowerCase().replace(/[\s\.\:\-\_]+/g, '')
  
  // Direct match by ID
  const direct = EVENT_ARRIVAL_SLOTS.find(s => s.id.toLowerCase().replace(/[\s\.\:\-\_]+/g, '') === cleaned)
  if (direct) return direct

  // Check if date explicitly specifies 19 or 20
  const isDay2 = cleaned.includes('20sep') || cleaned.includes('20sept') || cleaned.includes('day2') || (cleaned.includes('20') && !cleaned.includes('19'))
  const isDay1 = cleaned.includes('19sep') || cleaned.includes('19sept') || cleaned.includes('day1') || cleaned.includes('19')

  const targetSlots = isDay2 
    ? EVENT_ARRIVAL_SLOTS.filter(s => s.dateId === '20-sep')
    : isDay1
      ? EVENT_ARRIVAL_SLOTS.filter(s => s.dateId === '19-sep')
      : EVENT_ARRIVAL_SLOTS

  // Match by time string within target date slots
  const timeMatch = targetSlots.find(s => {
    const sClean = s.time.toLowerCase().replace(/[\s\.\:\-\_]+/g, '')
    return cleaned.includes(sClean)
  })
  if (timeMatch) return timeMatch

  // Legacy mappings
  if (cleaned === 'day1' || cleaned === '1') return EVENT_ARRIVAL_SLOTS[0]
  if (cleaned === 'day2' || cleaned === '2') return EVENT_ARRIVAL_SLOTS[17]

  // Fallback by date
  if (isDay2) return EVENT_ARRIVAL_SLOTS[17]
  if (isDay1) return EVENT_ARRIVAL_SLOTS[0]

  return null
}

export function resolveArrivalSlots(rawSlots) {
  let arr = Array.isArray(rawSlots) ? rawSlots : []
  if (typeof rawSlots === 'string') {
    try {
      arr = JSON.parse(rawSlots)
    } catch (e) {
      arr = rawSlots.split(',').map(s => s.trim()).filter(Boolean)
    }
  }

  const resolved = []
  const seenIds = new Set()

  for (const item of arr) {
    const slotId = typeof item === 'object' && item !== null ? (item.id || item.slotId) : item
    const found = getSlotById(slotId)
    if (found && !seenIds.has(found.id)) {
      seenIds.add(found.id)
      resolved.push(found)
    } else if (!found && slotId) {
      resolved.push({
        id: String(slotId),
        date: 'Event Access',
        time: String(slotId),
        session: 'ARRIVAL',
        sessionSub: '',
        dayLabel: 'Access'
      })
    }
  }

  if (resolved.length === 0) {
    resolved.push(EVENT_ARRIVAL_SLOTS[0])
  }

  return resolved
}

export function getCurrentEventDayGMT7() {
  const now = new Date()
  let gmt7Iso = ''
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now)
    
    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    gmt7Iso = `${year}-${month}-${day}`
  } catch (e) {
    gmt7Iso = now.toISOString().split('T')[0]
  }

  const map = {
    '2026-09-19': {
      id: 'day-1',
      num: '1',
      title: 'Day 1',
      isoDate: '2026-09-19',
      badge: 'DAY 1',
      dateText: 'DAY 1 - SATURDAY, 19 SEPTEMBER 2026',
      shortText: 'Day 1 - 19 September 2026'
    },
    '2026-09-20': {
      id: 'day-2',
      num: '2',
      title: 'Day 2',
      isoDate: '2026-09-20',
      badge: 'DAY 2',
      dateText: 'DAY 2 - SUNDAY, 20 SEPTEMBER 2026',
      shortText: 'Day 2 - 20 September 2026'
    }
  }

  if (map[gmt7Iso]) {
    return map[gmt7Iso]
  }

  if (gmt7Iso > '2026-09-20') {
    return map['2026-09-20']
  }

  return map['2026-09-19']
}
