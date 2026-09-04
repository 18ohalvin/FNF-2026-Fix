import db from '../src/server/db.js'

async function run() {
  await db.connect()

  const rawTicket = '81707909707|G27535'
  console.log('Testing QR Code:', rawTicket)

  // Current server.js logic:
  const cleanedCode = String(rawTicket).trim()
  let record1 = await db.getReservationByAccessId(cleanedCode)
  console.log('Searching with cleanedCode (81707909707|G27535):', record1 ? 'FOUND' : 'NOT FOUND (BUG!)')

  // Fixed server.js logic:
  let accessId = cleanedCode
  let guestPhone = ''
  if (cleanedCode.includes('|')) {
    const parts = cleanedCode.split('|')
    guestPhone = parts[0].trim()
    accessId = parts[1].trim()
  }

  let record2 = await db.getReservationByAccessId(accessId) || await db.getReservationByAccessId(guestPhone)
  console.log('Searching with extracted accessId (G27535) or phone (81707909707):', record2 ? `FOUND (${record2.first_name} ${record2.last_name}, Access ID: ${record2.access_id})` : 'NOT FOUND')

  process.exit(0)
}

run().catch(console.error)
