import db, { normalizeDayId } from '../src/server/db.js'

function isDayAllowed(bookedDates, targetDay) {
  if (!bookedDates) return true
  let datesArr = []
  if (Array.isArray(bookedDates)) datesArr = bookedDates
  else if (typeof bookedDates === 'string') {
    try { const parsed = JSON.parse(bookedDates); datesArr = Array.isArray(parsed) ? parsed : [bookedDates] } catch (e) { datesArr = bookedDates.split(',').map(s => s.trim()) }
  }
  if (datesArr.length === 0) return true
  const targetNum = normalizeDayId(targetDay)
  return datesArr.some(item => {
    let val = item
    if (typeof item === 'object' && item !== null) val = item.id || item.day || item.date || JSON.stringify(item)
    return normalizeDayId(val) === targetNum
  })
}

async function run() {
  await db.connect()

  const rawTicket = '81299887766|TEST345'
  const currentDay = 'Day 3'

  let primaryCode = rawTicket
  let secondaryCode = ''
  if (rawTicket.includes('|')) {
    const parts = rawTicket.split('|')
    secondaryCode = parts[0].trim()
    primaryCode = parts[1].trim()
  }

  let record = await db.getReservationByAccessId(primaryCode)
  if (!record && secondaryCode) record = await db.getReservationByAccessId(secondaryCode)

  console.log('Record found:', record ? record.access_id : 'NULL')
  console.log('Booked dates:', record ? record.selected_dates : 'NULL')
  console.log('isDayAllowed for Day 3:', record ? isDayAllowed(record.selected_dates, currentDay) : 'N/A')

  if (record && isDayAllowed(record.selected_dates, currentDay)) {
    console.log('✅ SCAN SUCCESSFUL! ACCESS GRANTED FOR DAY 3!')
  } else {
    console.error('❌ SCAN FAILED!')
  }

  process.exit(0)
}

run().catch(console.error)
