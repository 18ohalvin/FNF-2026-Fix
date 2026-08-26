<template>
  <div class="review-details-wrapper">
    <!-- Main Form Scrollable Container -->
    <main class="review-content">
      <!-- Title Row -->
      <div class="title-row">
        <h1 class="page-title">{{ isRegistered ? 'REVIEW DETAILS' : 'REGISTER' }}</h1>
        <span class="user-role-badge">{{ userDetails.role || 'VIP GUEST' }}</span>
      </div>

      <!-- Description Subtitle -->
      <p class="instruction-text">
        {{
          isRegistered
            ? 'Your VIP e-pass will be delivered to this email address. Please confirm your information below.'
            : 'Enter your details below. Your VIP e-pass will be sent to this email.'
        }}
      </p>

      <!-- Form Inputs Group -->
      <div class="fields-group">
        <!-- Salutation + First Name Row -->
        <div class="salutation-firstname-row">
          <button
            type="button"
            id="salutation-trigger-btn"
            class="salutation-btn"
            @click="isSalutationModalOpen = true"
          >
            <span class="salutation-value">{{ formattedSalutation }}</span>
            <span class="salutation-chevron">
              <img src="../assets/icon-chevron.svg" alt="" class="chevron-img" />
            </span>
          </button>

          <div class="firstname-input-wrapper">
            <FormInput
              v-model="userDetails.firstName"
              label="FIRST NAME*"
              placeholder="FIRST NAME*"
              :has-error="submitted && !userDetails.firstName"
            />
          </div>
        </div>

        <!-- Last Name Input -->
        <FormInput
          v-model="userDetails.lastName"
          label="LAST NAME*"
          placeholder="LAST NAME*"
          :has-error="submitted && !userDetails.lastName"
        />

        <!-- Email Input -->
        <FormInput
          v-model="userDetails.email"
          type="email"
          label="EMAIL*"
          placeholder="EMAIL*"
          helper-text="Must be an active inbox."
          :has-error="submitted && (!userDetails.email || !isValidEmail)"
        />

        <!-- Instagram Input -->
        <FormInput
          v-model="userDetails.instagram"
          label="INSTAGRAM HANDLE"
          placeholder="INSTAGRAM HANDLE"
        />
      </div>

      <!-- Confirmation Disclaimer with Info Icon -->
      <div class="data-concern-box">
        <div class="info-icon-holder">
          <img src="../assets/icon-info.svg" alt="Information" class="info-icon" />
        </div>
        <p class="data-concern-text">
          By continuing, I confirm my name and email address are correct.
        </p>
      </div>
    </main>

    <!-- Sticky Bottom CTA Button -->
    <CtaButton
      :active="isFormComplete"
      :loading="isSubmitting"
      label="NEXT"
      @click="handleSubmit"
    />

    <!-- Salutation Picker Bottom Sheet Modal -->
    <SalutationPickerModal
      :is-open="isSalutationModalOpen"
      :selected="userDetails.salutation"
      @close="isSalutationModalOpen = false"
      @select="val => userDetails.salutation = val"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FormInput from './FormInput.vue'
import CtaButton from './CtaButton.vue'
import SalutationPickerModal from './SalutationPickerModal.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      salutation: 'Mr.',
      firstName: '',
      lastName: '',
      email: '',
      instagram: '',
      role: 'VIP GUEST'
    })
  }
})

const emit = defineEmits(['submit'])

const userDetails = ref({ ...props.initialData })
const isSalutationModalOpen = ref(false)
const isSubmitting = ref(false)
const submitted = ref(false)

const isRegistered = computed(() => {
  return props.initialData?.isRegistered !== false && Boolean(props.initialData?.firstName?.trim())
})

const formattedSalutation = computed(() => {
  const val = (userDetails.value.salutation || 'Mr.').trim().toLowerCase()
  if (val.startsWith('mrs')) return 'Mrs.'
  if (val.startsWith('ms')) return 'Ms.'
  if (val.startsWith('mr')) return 'Mr.'
  return userDetails.value.salutation || 'Mr.'
})

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(userDetails.value.email)
})

const isFormComplete = computed(() => {
  return (
    Boolean(userDetails.value.firstName?.trim()) &&
    Boolean(userDetails.value.lastName?.trim()) &&
    Boolean(userDetails.value.email?.trim()) &&
    isValidEmail.value
  )
})

const handleSubmit = () => {
  submitted.value = true
  if (!isFormComplete.value) return

  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    emit('submit', userDetails.value)
  }, 800)
}
</script>

<style scoped>
.review-details-wrapper {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f2f2f2;
}

.review-content {
  flex: 1;
  padding: 24px 24px 32px 24px;
  display: flex;
  flex-direction: column;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.page-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 0;
  line-height: 32px;
}

.user-role-badge {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 300;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 32px;
}

.instruction-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 300;
  color: #000000;
  line-height: 20px;
  margin: 0 0 28px 0;
  max-width: 320px;
}

.fields-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.salutation-firstname-row {
  display: flex;
  gap: 16px;
  align-items: center;
  width: 100%;
}

.salutation-btn {
  width: 94px;
  height: 48px;
  background-color: #ededed;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

.salutation-value {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
}

.salutation-chevron {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(90deg); /* points right */
}

.chevron-img {
  width: 16px;
  height: 16px;
}

.firstname-input-wrapper {
  flex: 1;
  min-width: 0;
}

.data-concern-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
}

.info-icon-holder {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon {
  width: 22px;
  height: 22px;
  display: block;
}

.data-concern-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 300;
  color: #000000;
  line-height: 20px;
  margin: 0;
}
</style>
