<template>
  <div class="analytics-page-container">
    <div class="analytics-frame">
      <!-- HEADER CONTAINER -->
      <div class="header-container">
        <div class="header-subcontainer">
          <div class="header-title-group">
            <h1 class="page-title">CUSTOMER ANALYTICS DASHBOARD</h1>
            <div class="header-action-buttons">
              <!-- Customer Database Button -->
              <button
                type="button"
                class="header-btn outlined-btn"
                @click="emit('nav-database')"
              >
                <span>CUSTOMER DATABASE</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <!-- Scanner App Button -->
              <button
                type="button"
                class="header-btn solid-btn"
                @click="emit('nav-scanner')"
              >
                <span>SCANNER APP</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div class="logo-wrapper">
            <button
              type="button"
              class="header-logout-btn"
              title="Log out"
              aria-label="Log out"
              @click="handleLogout"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
            <img src="../assets/logo-707.png" alt="707 Logo" class="brand-logo" />
          </div>
        </div>
      </div>

      <!-- LIVE OCCUPANCY CONTAINER (Matching Figma 447:615) -->
      <div class="occupancy-section">
        <div class="occupancy-header">
          <span class="occupancy-title">LIVE OCCUPANCY</span>
          <span class="header-separator">|</span>
          <span class="event-date-text">{{ occupancyData.eventDayText || 'DAY 1 - MONDAY, 02 SEPTEMBER 2026' }}</span>
        </div>

        <div class="occupancy-data-container">
          <div class="occupancy-counter-wrapper">
            <div class="counter-number">{{ occupancyData.current }}</div>
            <div class="counter-max">/ {{ occupancyData.capacity }}</div>
          </div>

          <!-- Adjust Occupancy Action Button (Figma 470:63) -->
          <button
            type="button"
            class="adjust-occupancy-btn"
            @click="isAdjustModalOpen = true"
          >
            <span>ADJUST OCCUPANCY</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tune-icon">
              <line x1="21" y1="4" x2="14" y2="4"></line>
              <line x1="10" y1="4" x2="3" y2="4"></line>
              <line x1="21" y1="12" x2="12" y2="12"></line>
              <line x1="8" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="20" x2="16" y2="20"></line>
              <line x1="12" y1="20" x2="3" y2="20"></line>
              <line x1="14" y1="1" x2="14" y2="7"></line>
              <line x1="8" y1="9" x2="8" y2="15"></line>
              <line x1="16" y1="17" x2="16" y2="23"></line>
            </svg>
          </button>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${occupancyPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- HOURLY ARRIVALS SUMMARY CHART CARD -->
      <div class="summary-chart-card">
        <!-- Card Top Bar: Title & Calendar Date Picker Trigger -->
        <div class="card-header">
          <h2 class="card-title">HOURLY ARRIVALS</h2>

          <!-- Date Picker Button Trigger -->
          <button
            type="button"
            class="date-picker-btn"
            @click="isCalendarOpen = true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="calendar-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span class="date-text">{{ displayDateText }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron-icon">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        <!-- 4 Summary KPI Metric Cards Grid (Fully Interactive Tabs) -->
        <div class="summary-cards-grid">
          <!-- Card 1: TOTAL CHECKED IN -->
          <button
            type="button"
            class="kpi-card"
            :class="{ active: activeTab === 'totalCheckedIn' }"
            @click="activeTab = 'totalCheckedIn'"
          >
            <div class="kpi-label">
              <span>TOTAL</span>
              <span>CHECKED IN</span>
            </div>
            <div class="kpi-number">{{ summaryMetrics.totalCheckedIn }}</div>
          </button>

          <!-- Card 2: TOTAL UPCOMING ARRIVALS -->
          <button
            type="button"
            class="kpi-card"
            :class="{ active: activeTab === 'upcomingArrivals' }"
            @click="activeTab = 'upcomingArrivals'"
          >
            <div class="kpi-label">
              <span>TOTAL</span>
              <span>UPCOMING ARRIVALS</span>
            </div>
            <div class="kpi-number">{{ summaryMetrics.upcomingArrivals }}</div>
          </button>

          <!-- Card 3: VIPs CHECKED-IN -->
          <button
            type="button"
            class="kpi-card"
            :class="{ active: activeTab === 'vipsCheckedIn' }"
            @click="activeTab = 'vipsCheckedIn'"
          >
            <div class="kpi-label">
              <span>VIPs</span>
              <span>CHECKED-IN</span>
            </div>
            <div class="kpi-number">{{ summaryMetrics.vipsCheckedIn }}</div>
          </button>

          <!-- Card 4: FAILED SCANS / OVERRIDES -->
          <button
            type="button"
            class="kpi-card"
            :class="{ active: activeTab === 'failedScans' }"
            @click="activeTab = 'failedScans'"
          >
            <div class="kpi-label">
              <span>FAILED SCANS</span>
              <span>/ OVERRIDES</span>
            </div>
            <div class="kpi-number">{{ summaryMetrics.failedScans }}</div>
          </button>
        </div>

        <!-- Dynamic Dynamic SVG Line Chart Plotting Hourly Arrivals -->
        <div class="chart-wrapper">
          <div class="chart-y-axis">
            <span v-for="val in yAxisTicks" :key="'y-' + val">{{ val }}</span>
          </div>

          <div class="chart-body">
            <svg class="chart-svg" viewBox="0 0 1000 220" preserveAspectRatio="none">
              <!-- Subtle Horizontal Grid Lines -->
              <line v-for="(val, idx) in yAxisTicks" :key="'grid-' + idx" x1="0" :y1="getYPos(val)" x2="1000" :y2="getYPos(val)" stroke="rgba(0,0,0,0.06)" stroke-width="1" stroke-dasharray="4 4" />

              <!-- Smooth Area Gradient Fill Under Curve -->
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#000000" stop-opacity="0.12" />
                  <stop offset="100%" stop-color="#000000" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <path :d="chartAreaPath" fill="url(#chartGradient)" />

              <!-- Main Dynamic Curve Path -->
              <path :d="chartLinePath" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

              <!-- Interactive Data Point Circles & Tooltips -->
              <g v-for="(pt, idx) in chartPoints" :key="'pt-' + idx">
                <circle
                  :cx="pt.x"
                  :cy="pt.y"
                  r="4"
                  fill="#000000"
                  stroke="#ffffff"
                  stroke-width="2"
                  class="chart-dot"
                />
              </g>
            </svg>

            <!-- X-Axis Labels (00:00 to 22:00) -->
            <div class="chart-x-axis">
              <span v-for="item in activeHourlyData" :key="item.slot" class="x-slot-label">
                {{ item.slot }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Date Picker Modal -->
    <CalendarModal
      :is-open="isCalendarOpen"
      :selected-date="selectedIsoDate"
      @close="isCalendarOpen = false"
      @select="handleDateSelect"
    />

    <!-- Adjust Max Capacity Modal -->
    <AdjustOccupancyModal
      :is-open="isAdjustModalOpen"
      :current-capacity="occupancyData.capacity"
      :current-occupancy="occupancyData.current"
      @close="isAdjustModalOpen = false"
      @updated="handleCapacityUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CalendarModal from './CalendarModal.vue'
import AdjustOccupancyModal from './AdjustOccupancyModal.vue'
import { apiFetchAnalytics } from '../api/client'

const emit = defineEmits(['nav-database', 'nav-scanner', 'logout'])

const handleLogout = () => {
  localStorage.removeItem('staff_auth')
  sessionStorage.removeItem('staff_auth')
  emit('logout')
}

const isCalendarOpen = ref(false)
const isAdjustModalOpen = ref(false)
const selectedIsoDate = ref('2026-09-02')
const displayDateText = ref('Day 1 - 02 September 2026')
const activeTab = ref('totalCheckedIn') // 'totalCheckedIn' | 'upcomingArrivals' | 'vipsCheckedIn' | 'failedScans'

const occupancyData = ref({ current: 0, capacity: 100, eventDayText: 'DAY 1 - WEDNESDAY, 02 SEPTEMBER 2026' })

const handleCapacityUpdated = (newCapacity) => {
  occupancyData.value.capacity = newCapacity
  loadAnalytics()
}
const summaryMetrics = ref({ totalCheckedIn: 0, upcomingArrivals: 0, vipsCheckedIn: 0, failedScans: 0 })
const seriesData = ref({
  totalCheckedIn: [],
  upcomingArrivals: [],
  vipsCheckedIn: [],
  failedScans: []
})

const defaultHourlyData = [
  { slot: '00:00', count: 0 },
  { slot: '02:00', count: 0 },
  { slot: '04:00', count: 0 },
  { slot: '06:00', count: 0 },
  { slot: '08:00', count: 0 },
  { slot: '10:00', count: 0 },
  { slot: '12:00', count: 0 },
  { slot: '14:00', count: 0 },
  { slot: '16:00', count: 0 },
  { slot: '18:00', count: 0 },
  { slot: '20:00', count: 0 },
  { slot: '22:00', count: 0 }
]

const activeHourlyData = computed(() => {
  if (seriesData.value && seriesData.value[activeTab.value] && seriesData.value[activeTab.value].length > 0) {
    return seriesData.value[activeTab.value]
  }
  return defaultHourlyData
})

const occupancyPercent = computed(() => {
  if (!occupancyData.value.capacity) return 0
  return Math.min(100, Math.round((occupancyData.value.current / occupancyData.value.capacity) * 100))
})

const maxChartVal = computed(() => {
  const maxInSeries = Math.max(...activeHourlyData.value.map(d => d.count), 0)
  return Math.max(20, Math.ceil(maxInSeries / 5) * 5)
})

const yAxisTicks = computed(() => {
  const m = maxChartVal.value
  const step = m / 4
  return [m, m - step, m - (step * 2), step, 0]
})

const getYPos = (val) => {
  const chartHeight = 200
  const max = maxChartVal.value
  if (max === 0) return chartHeight
  return chartHeight - (val / max) * (chartHeight - 20) + 10
}

const chartPoints = computed(() => {
  const data = activeHourlyData.value
  const total = data.length
  if (total === 0) return []

  const stepX = 1000 / (total - 1 || 1)
  return data.map((d, i) => ({
    x: i * stepX,
    y: getYPos(d.count),
    val: d.count,
    slot: d.slot
  }))
})

const chartLinePath = computed(() => {
  const points = chartPoints.value
  if (points.length === 0) return ''

  // Smooth bezier curve generator
  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`
    const p0 = a[i - 1]
    const cx = (p0.x + point.x) / 2
    return `${acc} C ${cx},${p0.y} ${cx},${point.y} ${point.x},${point.y}`
  }, '')
})

const chartAreaPath = computed(() => {
  const line = chartLinePath.value
  if (!line) return ''
  return `${line} L 1000,210 L 0,210 Z`
})

const loadAnalytics = async () => {
  const res = await apiFetchAnalytics(selectedIsoDate.value)
  if (res) {
    if (res.occupancy) occupancyData.value = res.occupancy
    if (res.summary) summaryMetrics.value = res.summary
    if (res.series) {
      seriesData.value = res.series
    } else if (res.hourlyArrivals && res.hourlyArrivals.length > 0) {
      seriesData.value = {
        totalCheckedIn: res.hourlyArrivals,
        upcomingArrivals: res.hourlyArrivals.map(d => ({ ...d, count: Math.max(0, d.count - 1) })),
        vipsCheckedIn: res.hourlyArrivals,
        failedScans: res.hourlyArrivals.map(d => ({ ...d, count: 0 }))
      }
    }
  }
}

const handleDateSelect = (title, dayObj) => {
  displayDateText.value = title
  if (dayObj) {
    selectedIsoDate.value = dayObj.isoDate
    occupancyData.value.eventDayText = `${dayObj.badge} - ${dayObj.dateText.toUpperCase()}`
  }
  loadAnalytics()
}

let pollInterval = null

onMounted(() => {
  loadAnalytics()
  pollInterval = setInterval(() => {
    loadAnalytics()
  }, 4000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.analytics-page-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f2f2f2;
  padding: 0 24px 24px 24px;
  box-sizing: border-box;
}

.analytics-frame {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* HEADER */
.header-container {
  width: 100%;
}

.header-subcontainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  height: 60px;
  min-height: 60px;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.page-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.32px;
  color: #000000;
  margin: 0;
  white-space: nowrap;
}

.header-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  height: 40px;
  padding: 0 16px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.outlined-btn {
  background: transparent;
  border: 1px solid #000000;
  color: #000000;
}

.outlined-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.solid-btn {
  background: #000000;
  border: 1px solid #000000;
  color: #ffffff;
}

.solid-btn:hover {
  background: #222222;
}

.logo-wrapper {
  height: 60px;
  min-height: 60px;
  max-height: 60px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  box-sizing: border-box;
}

.header-logout-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  padding: 6px;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.header-logout-btn:hover {
  opacity: 1;
  color: #d32f2f;
  transform: translateX(-2px);
}

.brand-logo {
  height: 14px;
  width: 45px;
  object-fit: contain;
  display: block;
}

.divider-line {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
}

/* LIVE OCCUPANCY */
.occupancy-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.occupancy-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #000000;
}

.header-separator {
  color: rgba(0, 0, 0, 0.3);
}

.event-date-text {
  font-weight: 500;
  color: #000000;
}

.occupancy-data-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
  flex-wrap: wrap;
}

.occupancy-counter-wrapper {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.adjust-occupancy-btn {
  height: 40px;
  padding: 0 16px;
  border: 1px solid #000000;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.32px;
  color: #000000;
  text-transform: uppercase;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;
}

.adjust-occupancy-btn:hover {
  background: #000000;
  color: #ffffff;
}

.adjust-occupancy-btn:hover .tune-icon {
  stroke: #ffffff;
}

.tune-icon {
  stroke: #000000;
  transition: stroke 0.2s ease;
}

.counter-number {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 96px;
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -2.27px;
  color: #000000;
}

.counter-max {
  font-size: 24px;
  font-weight: 400;
  color: #000000;
}

.progress-track {
  width: 100%;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #000000;
  border-radius: 99px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* SUMMARY CHART CARD */
.summary-chart-card {
  background: #f2f2f2;
  border: 1px solid #e5e7eb;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: #111827;
  margin: 0;
}

.date-picker-btn {
  background: transparent;
  border: 1px solid #000000;
  height: 36px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #000000;
  transition: background-color 0.2s ease;
}

.date-picker-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .summary-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .summary-cards-grid {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 80px;
  box-sizing: border-box;
  background-color: #f2f2f2;
  border: 1px solid #000000;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #000000;
  text-align: left;
}

.kpi-card:hover:not(.active) {
  background-color: #e0e0e0;
}

.kpi-card.active {
  background-color: #000000;
  color: #ffffff;
  border-color: #000000;
}

.kpi-label {
  display: flex;
  flex-direction: column;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  line-height: 1.2;
}

.kpi-number {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

/* CHART WIDGET */
.chart-wrapper {
  display: flex;
  gap: 16px;
  height: 288px;
  padding: 16px 0;
  box-sizing: border-box;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 10px;
  color: #6b7280;
  font-weight: 400;
  width: 20px;
  padding-bottom: 24px;
}

.chart-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.chart-svg {
  width: 100%;
  height: 220px;
  overflow: visible;
}

.chart-dot {
  cursor: pointer;
  transition: r 0.2s ease;
}

.chart-dot:hover {
  r: 6;
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: #6b7280;
  font-weight: 500;
  padding-top: 8px;
}

.x-slot-label {
  width: 34px;
  text-align: center;
}

@media (max-width: 768px) {
  .analytics-page-container {
    padding: 0 16px 16px 16px;
  }

  .header-subcontainer {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-title-group {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-action-buttons {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }

  .header-btn {
    width: 100%;
    justify-content: space-between;
  }

  .counter-number {
    font-size: 72px;
  }

  .counter-max {
    font-size: 20px;
  }

  .chart-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .chart-body {
    min-width: 500px;
  }
}
</style>
