import db from '../src/server/db.js'

async function run() {
  await db.connect()

  console.log('--- Test getAnalyticsData() with empty query ---')
  const res1 = await db.getAnalyticsData('')
  console.log('Empty query occupancy:', res1.occupancy)

  console.log('--- Test getAnalyticsData("2026-09-03") ---')
  const res2 = await db.getAnalyticsData('2026-09-03')
  console.log('Sept 03 occupancy:', res2.occupancy)

  if (res1.occupancy.eventDayText.includes('DAY 2') && res2.occupancy.eventDayText.includes('DAY 2')) {
    console.log('✅ SUCCESS! Analytics correctly resolves to Day 2 in GMT+7!')
  } else {
    console.error('❌ Mismatch in analytics day resolution!')
  }

  process.exit(0)
}

run().catch(console.error)
