import db from '../src/server/db.js'

async function run() {
  await db.connect()

  console.log('--- TEST 1: Check existing guest ---')
  const phone = '81707909707'
  const beforeResv = await db.getReservationByPhone(phone)
  console.log('Before dates:', beforeResv?.selected_dates)

  console.log('--- TEST 2: Admin edits dates to Day 3 & Day 4 only ---')
  await db.updateGuest(phone, {
    selectedDates: ['day-3', 'day-4']
  })

  const afterResv = await db.getReservationByPhone(phone)
  console.log('After dates:', afterResv?.selected_dates)

  if (afterResv?.selected_dates.includes('day-3') && afterResv?.selected_dates.includes('day-4') && !afterResv?.selected_dates.includes('day-1')) {
    console.log('✅ SUCCESS! Admin date override works correctly.')
  } else {
    console.error('❌ FAIL! Dates were not overridden properly.')
  }

  // Restore original dates
  await db.updateGuest(phone, {
    selectedDates: ['day-1', 'day-2']
  })
  console.log('Restored dates to Day 1 & Day 2.')
  process.exit(0)
}

run().catch(console.error)
