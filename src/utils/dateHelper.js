/**
 * Shared Helper for Event Date Calculation based on GMT+7 (Asia/Jakarta / WIB) internet time.
 * Event schedule:
 * - Day 1: 02 September 2026 (Wednesday)
 * - Day 2: 03 September 2026 (Thursday)
 * - Day 3: 04 September 2026 (Friday)
 * - Day 4: 05 September 2026 (Saturday)
 * - Day 5: 06 September 2026 (Sunday)
 */

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
    '2026-09-02': {
      id: 'day-1',
      num: '1',
      title: 'Day 1',
      isoDate: '2026-09-02',
      badge: 'DAY 1',
      dateText: 'DAY 1 - WEDNESDAY, 02 SEPTEMBER 2026',
      shortText: 'Day 1 - 02 September 2026'
    },
    '2026-09-03': {
      id: 'day-2',
      num: '2',
      title: 'Day 2',
      isoDate: '2026-09-03',
      badge: 'DAY 2',
      dateText: 'DAY 2 - THURSDAY, 03 SEPTEMBER 2026',
      shortText: 'Day 2 - 03 September 2026'
    },
    '2026-09-04': {
      id: 'day-3',
      num: '3',
      title: 'Day 3',
      isoDate: '2026-09-04',
      badge: 'DAY 3',
      dateText: 'DAY 3 - FRIDAY, 04 SEPTEMBER 2026',
      shortText: 'Day 3 - 04 September 2026'
    },
    '2026-09-05': {
      id: 'day-4',
      num: '4',
      title: 'Day 4',
      isoDate: '2026-09-05',
      badge: 'DAY 4',
      dateText: 'DAY 4 - SATURDAY, 05 SEPTEMBER 2026',
      shortText: 'Day 4 - 05 September 2026'
    },
    '2026-09-06': {
      id: 'day-5',
      num: '5',
      title: 'Day 5',
      isoDate: '2026-09-06',
      badge: 'DAY 5',
      dateText: 'DAY 5 - SUNDAY, 06 SEPTEMBER 2026',
      shortText: 'Day 5 - 06 September 2026'
    }
  }

  if (map[gmt7Iso]) {
    return map[gmt7Iso]
  }

  if (gmt7Iso > '2026-09-06') {
    return map['2026-09-06']
  }

  return map['2026-09-02']
}
