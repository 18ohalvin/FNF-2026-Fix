import { normalizeDayId } from '../src/server/db.js'

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

  return datesArr.some(item => {
    let val = item
    if (typeof item === 'object' && item !== null) {
      val = item.id || item.day || item.date || JSON.stringify(item)
    }
    return normalizeDayId(val) === targetNum
  })
}

console.log('Testing ["day-3", "day-4", "day-5"] for Day 3:', isDayAllowed(['day-3', 'day-4', 'day-5'], 'Day 3'))
console.log('Testing [{"id":"day-3"}] for Day 3:', isDayAllowed([{ id: 'day-3' }], 'Day 3'))
console.log('Testing "[\"day-3\",\"day-4\"]" for Day 3:', isDayAllowed('["day-3","day-4"]', 'Day 3'))
console.log('Testing "[\"day-1\"]" for Day 3:', isDayAllowed('["day-1"]', 'Day 3'))
