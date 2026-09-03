import db from '../src/server/db.js'

async function run() {
  await db.connect()
  const data = await db.getAnalyticsData('2026-09-03')
  console.log('Backend db.getAnalyticsData("2026-09-03") returned:', JSON.stringify(data.occupancy, null, 2))
  process.exit(0)
}

run().catch(console.error)
