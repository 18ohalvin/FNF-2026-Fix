/**
 * Format "VALID FOR" lines matching business rules:
 * - VIP Day 1 -> "VIP: DAY 1"
 * - All Public Days (2, 3, 4, 5) -> "PUBLIC: ALL DAY"
 * - Specific Public Days (e.g. 2, 4) -> "PUBLIC: DAY 2, 4"
 * - If both VIP Day 1 and Public days are selected:
 *     VIP: DAY 1
 *     PUBLIC: ALL DAY (or PUBLIC: DAY 2, 4)
 */
export function formatValidForLines(selectedDates, role = 'VIP GUEST') {
  const isVipRole = (role || '').toUpperCase().includes('VIP')
  
  let arr = []
  if (Array.isArray(selectedDates)) {
    arr = selectedDates
  } else if (typeof selectedDates === 'string') {
    try {
      arr = JSON.parse(selectedDates)
    } catch (e) {
      arr = selectedDates.split(',').map(s => s.trim())
    }
  }

  // Map to lowercase string tokens
  const tokens = arr.map(item => {
    if (typeof item === 'object' && item !== null) {
      if (item.id) return String(item.id).toLowerCase()
      if (item.day) return String(item.day).toLowerCase()
    }
    return String(item).toLowerCase()
  })

  // VIP Day 1 check
  const hasVipDay = tokens.some(t => t === 'day-1' || t === '1' || t.includes('vip') || t.includes('day 1'))

  // Public Days check (Day 2, Day 3, Day 4, Day 5)
  const publicDayNums = []
  const publicMap = [
    { num: 2, keys: ['day-2', '2', 'day 2'] },
    { num: 3, keys: ['day-3', '3', 'day 3'] },
    { num: 4, keys: ['day-4', '4', 'day 4'] },
    { num: 5, keys: ['day-5', '5', 'day 5'] }
  ]

  for (const item of publicMap) {
    if (tokens.some(t => item.keys.some(k => t === k || t.includes(k)))) {
      publicDayNums.push(item.num)
    }
  }

  const lines = []

  // 1. VIP line
  if (hasVipDay) {
    lines.push('VIP: DAY 1')
  }

  // 2. Public line
  if (publicDayNums.length === 4) {
    lines.push('PUBLIC: ALL DAY')
  } else if (publicDayNums.length > 0) {
    lines.push(`PUBLIC: DAY ${publicDayNums.join(', ')}`)
  }

  // Fallback if no specific day matched
  if (lines.length === 0) {
    if (isVipRole) {
      lines.push('VIP: DAY 1')
    } else {
      lines.push('PUBLIC: ALL DAY')
    }
  }

  return lines
}
