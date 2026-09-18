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
                <option value="GUEST">GUEST</option>
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

          <!-- Booked Event Slots Selector -->
          <div class="form-group">
            <div class="field-label-row">
              <label class="field-label">Booked Arrival / Session Slots</label>
              <span class="slot-count-badge">{{ form.selectedDates.length }} selected</span>
            </div>
            <div class="slots-container">
              <div v-for="group in dateGroups" :key="group.id" class="date-slot-group">
                <div class="date-group-header">
                  <span class="group-title">{{ group.date }}</span>
                  <span class="group-meta">{{ group.slots.length }} SLOTS AVAILABLE</span>
                </div>
                <div class="slot-grid">
                  <label
                    v-for="slot in group.slots"
                    :key="slot.id"
                    class="slot-check-card"
                    :class="{ 
                      active: form.selectedDates.includes(slot.id),
                      'is-live': slot.session.includes('LIVE')
                    }"
                  >
                    <input
                      type="checkbox"
                      :value="slot.id"
                      v-model="form.selectedDates"
                      class="hidden-check"
                    />
                    <div class="slot-card-body">
                      <div class="slot-time-text">{{ slot.time }}</div>
                      <div class="slot-tag" :class="slot.session.includes('LIVE') ? 'tag-live' : 'tag-playback'">
                        {{ slot.session }}{{ slot.sessionSub ? ` • ${slot.sessionSub}` : '' }}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
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
import { EVENT_DATE_GROUPS, EVENT_ARRIVAL_SLOTS } from '../utils/dateHelper'

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
const dateGroups = EVENT_DATE_GROUPS

const form = reactive({
  salutation: 'Mr.',
  firstName: '',
  lastName: '',
  email: '',
  role: 'GUEST',
  accessId: '',
  isCheckedIn: 0,
  selectedDates: []
})

const parseDatesSafely = (datesInput) => {
  if (!datesInput) return ['19sep-1700']
  if (Array.isArray(datesInput)) return datesInput
  if (typeof datesInput === 'string') {
    const trimmed = datesInput.trim()
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch (e) {}
    }
    const split = trimmed.split(',').map(s => s.trim()).filter(Boolean)
    if (split.length > 0) return split
  }
  return ['19sep-1700']
}

watch(
  () => props.guest,
  (g) => {
    if (g) {
      form.salutation = g.salutation || 'Mr.'
      form.firstName = g.first_name || g.firstName || ''
      form.lastName = g.last_name || g.lastName || ''
      form.email = g.email || ''
      form.role = 'GUEST'
      form.accessId = g.access_id || ''
      form.isCheckedIn = g.is_checked_in ? 1 : 0
      form.selectedDates = parseDatesSafely(g.selected_dates)
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

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slot-count-badge {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  color: #333333;
}

.slots-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.date-slot-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 4px;
  border-bottom: 1px solid #e0e0e0;
}

.group-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: #111111;
  letter-spacing: 0.5px;
}

.group-meta {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: #888888;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 6px;
}

.slot-check-card {
  display: block;
  border: 1px solid #dddddd;
  border-radius: 4px;
  background: #ffffff;
  padding: 6px 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.slot-check-card:hover {
  border-color: #999999;
}

.slot-check-card.active {
  background: #000000;
  border-color: #000000;
}

.slot-check-card.is-live {
  border-left: 3px solid #ff5500;
}

.slot-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-time-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #111111;
}

.slot-check-card.active .slot-time-text {
  color: #ffffff;
}

.slot-tag {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 9px;
  font-weight: 600;
  line-height: 1.2;
}

.tag-playback {
  color: #777777;
}

.slot-check-card.active .tag-playback {
  color: #cccccc;
}

.tag-live {
  color: #ff5500;
  font-weight: 700;
}

.slot-check-card.active .tag-live {
  color: #ff9966;
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

@media (max-width: 600px) {
  .edit-modal-card {
    padding: 24px 18px;
    max-height: 94dvh;
  }
  .form-row-grid,
  .form-row-grid-2 {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .col-salutation {
    width: 100%;
  }
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
