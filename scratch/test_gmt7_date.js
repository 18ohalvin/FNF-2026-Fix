import { getCurrentEventDayGMT7 } from '../src/utils/dateHelper.js'

console.log('--- GMT+7 Event Day Helper Test ---')
const currentInfo = getCurrentEventDayGMT7()
console.log('Resolved Day Info:', currentInfo)

if (currentInfo.id === 'day-2' && currentInfo.dateText.includes('03 SEPTEMBER 2026')) {
  console.log('✅ SUCCESS! Correctly resolved today (3 Sept 2026) as Day 2 in GMT+7.')
} else {
  console.error('❌ FAIL! Day info mismatch:', currentInfo)
}
