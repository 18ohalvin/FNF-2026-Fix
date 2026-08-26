<template>
  <Teleport to="body">
    <Transition name="slide-fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-drawer">
          <div class="drawer-header">
            <div class="header-titles">
              <h2 class="drawer-title">SECURITY SCAN LOGS</h2>
              <span class="drawer-subtitle">Live Venue Entrance & Exit Activity</span>
            </div>
            <button type="button" class="close-btn" @click="emit('close')" aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="drawer-body">
            <!-- Stats Bar -->
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-num">{{ currentOccupancy }}</span>
                <span class="stat-label">Live Inside</span>
              </div>
              <div class="stat-card">
                <span class="stat-num">{{ checkedInCount }}</span>
                <span class="stat-label">Checked In</span>
              </div>
              <div class="stat-card">
                <span class="stat-num">{{ checkedOutCount }}</span>
                <span class="stat-label">Checked Out</span>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="action-bar">
              <button type="button" class="refresh-btn" @click="emit('refresh')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                Refresh Activity
              </button>
              <button type="button" class="reset-btn" @click="emit('reset')">
                Reset Demo Counter
              </button>
            </div>

            <!-- Scans Feed -->
            <div class="scans-list">
              <div v-if="!scans || scans.length === 0" class="empty-state">
                No scans recorded yet today.
              </div>

              <div
                v-for="item in scans"
                :key="item.id"
                class="scan-item"
                :class="item.action"
              >
                <div class="scan-left">
                  <span
                    class="action-badge"
                    :class="item.action === 'check-in' ? 'badge-in' : 'badge-out'"
                  >
                    {{ item.action === 'check-in' ? 'IN' : 'OUT' }}
                  </span>
                  <div class="scan-details">
                    <div class="guest-name">{{ item.guest_name || 'VIP Guest' }}</div>
                    <div class="access-code">Ticket / Access ID: {{ item.access_id || item.guest_phone || 'N/A' }}</div>
                  </div>
                </div>
                <div class="scan-right">
                  <span
                    class="status-tag"
                    :class="item.status === 'GRANTED' ? 'status-granted' : 'status-denied'"
                  >
                    {{ item.status }}
                  </span>
                  <time class="time-stamp">{{ formatTime(item.scanned_at) }}</time>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  scans: { type: Array, default: () => [] },
  currentOccupancy: { type: Number, default: 0 },
  checkedInCount: { type: Number, default: 0 },
  checkedOutCount: { type: Number, default: 0 }
})

const emit = defineEmits(['close', 'refresh', 'reset'])

const formatTime = (ts) => {
  if (!ts) return 'Just now'
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    return 'Recent'
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
}

.modal-drawer {
  width: 100%;
  max-width: 480px;
  height: 100%;
  background: #ffffff;
  color: #000000;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.25);
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  padding: 24px;
  border-bottom: 1px solid #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f9f9f9;
}

.drawer-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.drawer-subtitle {
  font-size: 11px;
  color: #666666;
  display: block;
  margin-top: 2px;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  border: 1px solid #000000;
  padding: 12px 8px;
  text-align: center;
  background-color: #f2f2f2;
}

.stat-num {
  display: block;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #444444;
  margin-top: 4px;
  display: block;
  letter-spacing: 0.5px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.refresh-btn, .reset-btn {
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 14px;
  border: 1px solid #000000;
  background: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.refresh-btn:hover, .reset-btn:hover {
  background: #000000;
  color: #ffffff;
}

.scans-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 32px 0;
  color: #888888;
  font-size: 13px;
}

.scan-item {
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  transition: border-color 0.2s ease;
}

.scan-item:hover {
  border-color: #000000;
}

.scan-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  letter-spacing: 0.5px;
}

.badge-in {
  background-color: #000000;
  color: #ffffff;
}

.badge-out {
  background-color: #f2f2f2;
  color: #000000;
  border: 1px solid #000000;
}

.guest-name {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.access-code {
  font-size: 11px;
  color: #666666;
}

.scan-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.status-tag {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  text-transform: uppercase;
}

.status-granted {
  background-color: #e6f4ea;
  color: #137333;
}

.status-denied {
  background-color: #fce8e6;
  color: #c5221f;
}

.time-stamp {
  font-size: 10px;
  color: #888888;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}
</style>
