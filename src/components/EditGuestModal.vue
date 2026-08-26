<template>
  <Transition name="modal-fade">
    <div v-if="isOpen && guest" class="modal-backdrop" @click.self="handleClose">
      <div class="edit-modal-card" role="dialog" aria-modal="true">
        <div class="edit-modal-header">
          <div>
            <h2 class="modal-title">EDIT GUEST DETAILS</h2>
            <p class="modal-subtitle">Update customer information, ticket dates, or role</p>
          </div>
          <button type="button" class="close-btn" @click="handleClose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form class="edit-modal-form" @submit.prevent="handleSubmit">
          <!-- Salutation & Names -->
          <div class="form-row-grid">
            <div class="form-group col-salutation">
              <label class="field-label">Salutation</label>
              <select v-model="form.salutation" class="form-select">
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
              </select>
            </div>
            <div class="form-group col-first">
              <label class="field-label">First Name</label>
              <input v-model="form.firstName" type="text" required class="form-input" placeholder="e.g. DEWI" />
            </div>
            <div class="form-group col-last">
              <label class="field-label">Last Name</label>
              <input v-model="form.lastName" type="text" class="form-input" placeholder="e.g. LESTARI" />
            </div>
          </div>

          <!-- Role & Status -->
          <div class="form-row-grid-2">
            <div class="form-group">
              <label class="field-label">Guest Role</label>
              <select v-model="form.role" class="form-select">
                <option value="VIP GUEST">VIP GUEST</option>
                <option value="PUBLIC">PUBLIC</option>
              </select>
            </div>
            <div class="form-group">
              <label class="field-label">Check-In Status</label>
              <select v-model="form.isCheckedIn" class="form-select">
                <option :value="0">Not Checked In</option>
                <option :value="1">Checked In (Inside Venue)</option>
              </select>
            </div>
          </div>

          <!-- Email & Phone -->
          <div class="form-row-grid-2">
            <div class="form-group">
              <label class="field-label">Email Address</label>
              <input v-model="form.email" type="email" required class="form-input" placeholder="e.g. dewi@example.com" />
            </div>
            <div class="form-group">
              <label class="field-label">Phone Number (Read-only)</label>
              <input :value="guest.phone" type="text" disabled class="form-input disabled-input" />
            </div>
          </div>

          <!-- Access ID -->
          <div class="form-group">
            <label class="field-label">Ticket Access ID</label>
            <input v-model="form.accessId" type="text" class="form-input" placeholder="e.g. 0102-1108-1245" />
          </div>

          <!-- Booked Event Days Selector -->
          <div class="form-group">
            <label class="field-label">Booked Event Days</label>
            <div class="days-checkbox-group">
              <label
                v-for="day in eventDays"
                :key="day.id"
                class="day-check-item"
                :class="{ active: form.selectedDates.includes(day.id) }"
              >
                <input
                  type="checkbox"
                  :value="day.id"
                  v-model="form.selectedDates"
                  class="hidden-check"
                />
                <span class="day-badge-text">{{ day.label }}</span>
              </label>
            </div>
          </div>

          <!-- Modal Action Buttons -->
          <div class="edit-modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose">
              Cancel
            </button>
            <button type="submit" class="btn-save" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : 'SAVE CHANGES' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { apiUpdateGuest } from '../api/client'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  guest: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const isSaving = ref(false)

const eventDays = [
  { id: 'day-1', label: 'Day 1' },
  { id: 'day-2', label: 'Day 2' },
  { id: 'day-3', label: 'Day 3' },
  { id: 'day-4', label: 'Day 4' },
  { id: 'day-5', label: 'Day 5' }
]

const form = reactive({
  salutation: 'Mr.',
  firstName: '',
  lastName: '',
  email: '',
  role: 'VIP GUEST',
  accessId: '',
  isCheckedIn: 0,
  selectedDates: []
})

watch(
  () => props.guest,
  (g) => {
    if (g) {
      form.salutation = g.salutation || 'Mr.'
      form.firstName = g.first_name || g.firstName || ''
      form.lastName = g.last_name || g.lastName || ''
      form.email = g.email || ''
      form.role = (g.role || '').toUpperCase().includes('VIP') ? 'VIP GUEST' : 'PUBLIC'
      form.accessId = g.access_id || ''
      form.isCheckedIn = g.is_checked_in ? 1 : 0

      try {
        const dates = typeof g.selected_dates === 'string' ? JSON.parse(g.selected_dates) : g.selected_dates
        form.selectedDates = Array.isArray(dates) ? dates : ['day-1']
      } catch (e) {
        form.selectedDates = ['day-1']
      }
    }
  },
  { immediate: true }
)

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!props.guest || isSaving.value) return
  isSaving.value = true

  try {
    const data = await apiUpdateGuest(props.guest.phone, {
      salutation: form.salutation,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      role: form.role,
      accessId: form.accessId,
      isCheckedIn: form.isCheckedIn === 1,
      selectedDates: form.selectedDates
    })

    isSaving.value = false

    if (data && data.success) {
      emit('saved')
      emit('close')
    } else {
      alert((data && data.error) || 'Failed to update guest details')
    }
  } catch (err) {
    isSaving.value = false
    alert('Server error updating guest: ' + err.message)
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.edit-modal-card {
  width: 100%;
  max-width: 560px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  padding: 28px 24px;
  box-sizing: border-box;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #eeeeee;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.modal-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  letter-spacing: -0.3px;
}

.modal-subtitle {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #666666;
  margin: 4px 0 0 0;
}

.close-btn {
  background: none;
  border: none;
  color: #999999;
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: #000000;
}

.edit-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row-grid {
  display: grid;
  grid-template-columns: 90px 1fr 1fr;
  gap: 12px;
}

.form-row-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #333333;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.form-input,
.form-select {
  height: 40px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  padding: 0 12px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #000000;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: #000000;
}

.disabled-input {
  background: #f5f5f5;
  color: #888888;
  cursor: not-allowed;
}

.days-checkbox-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.day-check-item {
  flex: 1;
  min-width: 70px;
  height: 38px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f9f9f9;
  user-select: none;
  transition: all 0.15s ease;
}

.day-check-item.active {
  background: #000000;
  color: #ffffff;
  border-color: #000000;
}

.day-badge-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
}

.hidden-check {
  display: none;
}

.edit-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid #eeeeee;
}

.btn-cancel {
  height: 44px;
  padding: 0 20px;
  background: #f0f0f0;
  color: #000000;
  border: none;
  border-radius: 4px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #e4e4e4;
}

.btn-save {
  height: 44px;
  padding: 0 24px;
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-save:hover {
  background: #222222;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
