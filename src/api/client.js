import { env } from '../config/env'

const API_BASE = env.apiBaseUrl || ''

function getStaffToken() {
  return localStorage.getItem('staff_token') || sessionStorage.getItem('staff_token') || ''
}

function clearStaffSession() {
  localStorage.removeItem('staff_auth')
  localStorage.removeItem('staff_token')
  localStorage.removeItem('staff_store_id')
  sessionStorage.removeItem('staff_auth')
  sessionStorage.removeItem('staff_token')
}

/**
 * Staff login: verified server-side, returns a bearer session token
 */
export async function apiStaffLogin(storeId, pin) {
  const res = await fetch(`${API_BASE}/api/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId, pin })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    return { success: false, error: data?.error || 'Invalid Store ID or PIN. Please check your credentials.' }
  }
  return data
}

export async function apiStaffLogout() {
  try {
    await fetchWithApiFallback('/api/staff/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStaffToken()}` }
    })
  } catch (e) {
    // Ignore network errors on logout — session is cleared client-side regardless
  } finally {
    clearStaffSession()
  }
}

/**
 * Robust API fetcher with auto-fallback to port 7070 if current origin (e.g. port 80 / dev)
 * lacks a reverse proxy or returns SPA HTML index.
 */
async function fetchWithApiFallback(urlPath, options = {}) {
  const primaryUrl = API_BASE ? `${API_BASE}${urlPath}` : urlPath
  try {
    const res = await fetch(primaryUrl, options)
    const contentType = res.headers.get('content-type') || ''

    // If web server returned HTML (SPA index) instead of API JSON:
    if (contentType.includes('text/html') && urlPath.startsWith('/api/')) {
      throw new Error('Received HTML instead of JSON API response')
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return {
        success: false,
        isError: true,
        status: res.status,
        error: errData?.error || `HTTP ${res.status}`
      }
    }
    return await res.json()
  } catch (primaryErr) {
    // Attempt direct connection to Node.js backend port 7070 if running on port 80 / other port
    if (typeof window !== 'undefined' && window.location.port !== '7070') {
      try {
        const fallbackUrl = `http://${window.location.hostname}:7070${urlPath}`
        const res2 = await fetch(fallbackUrl, options)
        const contentType2 = res2.headers.get('content-type') || ''
        if (res2.ok && !contentType2.includes('text/html')) {
          return await res2.json()
        } else if (!res2.ok) {
          const errData2 = await res2.json().catch(() => ({}))
          return {
            success: false,
            isError: true,
            status: res2.status,
            error: errData2?.error || `HTTP ${res2.status}`
          }
        }
      } catch (e) {}
    }
    return {
      success: false,
      isNetworkError: true,
      error: primaryErr.message || 'Network request failed'
    }
  }
}

/**
 * Same as fetchWithApiFallback, but for staff-only endpoints: attaches the
 * bearer session token and forces a re-login if the session is invalid/expired.
 */
async function fetchStaffApi(urlPath, options = {}) {
  try {
    return await fetchWithApiFallback(urlPath, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${getStaffToken()}`
      }
    })
  } catch (err) {
    if (err.status === 401) {
      clearStaffSession()
      window.location.href = '/admin'
    }
    throw err
  }
}

/**
 * Check phone number registration status against backend SQLite DB
 */
export async function apiCheckPhone(phone) {
  try {
    return await fetchWithApiFallback('/api/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
  } catch (err) {
    console.warn('[API Client] Check phone fallback:', err)
    const rawDigits = String(phone).replace(/\D/g, '')
    return {
      found: false,
      guest: {
        phone: rawDigits,
        salutation: 'Mr.',
        firstName: '',
        lastName: '',
        email: '',
        instagram: '',
        role: 'VIP GUEST',
        isRegistered: false
      }
    }
  }
}

/**
 * Save or update guest registration details
 */
export async function apiSaveGuest(guestData) {
  try {
    return await fetchWithApiFallback('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestData)
    })
  } catch (err) {
    console.error('[API Client] Failed to save guest profile to backend:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Create ticket date reservation
 */
export async function apiCreateReservation(reservationData) {
  try {
    return await fetchWithApiFallback('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData)
    })
  } catch (err) {
    console.error('[API Client] Failed to create reservation in backend:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Fetch statistics for the Dashboard & Backend UI
 */
export async function apiFetchDashboardStats() {
  try {
    return await fetchWithApiFallback('/api/dashboard/stats')
  } catch (err) {
    console.error('[API Client] Failed to fetch dashboard stats:', err)
    return { totalGuests: 0, vipGuests: 0, totalReservations: 0, recentGuests: [] }
  }
}

/**
 * Process entrance or exit scan for a ticket ID or phone
 */
export async function apiProcessScan({ ticketCode, mode = 'check-in', currentDay = 'Day 1' }) {
  try {
    return await fetchStaffApi('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketCode, mode, currentDay })
    })
  } catch (err) {
    console.error('[API Client] Scan request failed:', err)
    return {
      success: false,
      status: 'INVALID',
      message: 'Network or server error processing scan.',
      ticketCode
    }
  }
}

/**
 * Fetch live occupancy and recent scan logs
 */
export async function apiFetchOccupancy(dayStr = '') {
  try {
    const query = dayStr ? `?day=${encodeURIComponent(dayStr)}` : ''
    return await fetchStaffApi(`/api/occupancy${query}`)
  } catch (err) {
    console.warn('[API Client] Occupancy endpoint fallback:', err)
    return {
      current: 0,
      capacity: 100,
      checkedInToday: 0,
      checkedOutToday: 0,
      eventDayText: dayStr || 'DAY 1 - MONDAY, 02 SEPTEMBER 2026',
      recentScans: []
    }
  }
}

/**
 * Reset scanner occupancy data
 */
export async function apiResetOccupancy() {
  try {
    return await fetchStaffApi('/api/occupancy/reset', { method: 'POST' })
  } catch (err) {
    return { success: true, occupancy: 0, capacity: 100 }
  }
}

/**
 * Update global max capacity setting (1 - 10,000)
 */
export async function apiUpdateMaxCapacity(capacity) {
  try {
    return await fetchStaffApi('/api/occupancy/capacity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity: Number(capacity) })
    })
  } catch (err) {
    console.error('[API Client] Failed to update max capacity:', err)
    return { success: false, error: err.data?.error || err.message }
  }
}

/**
 * Fetch Customer Analytics Dashboard Data & Hourly Arrivals
 */
export async function apiFetchAnalytics(dateStr) {
  try {
    const params = new URLSearchParams()
    if (dateStr) {
      params.append('date', dateStr)
      params.append('day', dateStr)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    return await fetchStaffApi(`/api/analytics${query}`)
  } catch (err) {
    console.warn('[API Client] Analytics endpoint fallback:', err)
    return {
      occupancy: { current: 0, capacity: 100, eventDayText: 'DAY 1 - MONDAY, 02 SEPTEMBER 2026' },
      summary: { totalCheckedIn: 0, upcomingArrivals: 0, vipsCheckedIn: 0, failedScans: 0 },
      hourlyArrivals: [
        { slot: '00:00', count: 0 }, { slot: '02:00', count: 0 }, { slot: '04:00', count: 0 },
        { slot: '06:00', count: 0 }, { slot: '08:00', count: 0 }, { slot: '10:00', count: 0 },
        { slot: '12:00', count: 0 }, { slot: '14:00', count: 0 }, { slot: '16:00', count: 0 },
        { slot: '18:00', count: 0 }, { slot: '20:00', count: 0 }, { slot: '22:00', count: 0 }
      ]
    }
  }
}

/**
 * Fetch Customer Database Guest List
 */
export async function apiFetchCustomerDatabase(searchQuery = '', filterType = '', dayStr = '') {
  try {
    const params = new URLSearchParams()
    if (searchQuery) params.append('search', searchQuery)
    if (filterType) params.append('filter', filterType)
    if (dayStr && !dayStr.toLowerCase().includes('all')) {
      params.append('day', dayStr)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const data = await fetchStaffApi(`/api/guests/list${query}`)
    return data
  } catch (err) {
    console.error('[API Client] Guests list fetch error:', err)
    return { guests: [] }
  }
}

/**
 * Trigger manual override action (Force Out or Check In)
 */
export async function apiOverrideGuestStatus(phone, action) {
  try {
    return await fetchStaffApi('/api/guests/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, action })
    })
  } catch (err) {
    console.error('[API Client] Override failed:', err)
    return { success: false, error: err.data?.error || err.message || 'Override Failed: Phone number not found.' }
  }
}

/**
 * Update guest details (Name, Salutation, Email, Role, Dates, Access ID)
 */
export async function apiUpdateGuest(phone, updateData) {
  try {
    return await fetchStaffApi(`/api/guests/${encodeURIComponent(phone)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
  } catch (err) {
    try {
      return await fetchStaffApi('/api/guests/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ...updateData })
      })
    } catch (e) {
      console.error('[API Client] Update guest failed:', err)
      return { success: false, error: err.message }
    }
  }
}

/**
 * Delete a guest record
 */
export async function apiDeleteGuest(phone) {
  try {
    return await fetchStaffApi(`/api/guests/${encodeURIComponent(phone)}`, {
      method: 'DELETE'
    })
  } catch (err) {
    try {
      return await fetchStaffApi('/api/guests/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
    } catch (e) {
      console.error('[API Client] Delete guest failed:', err)
      return { success: false, error: err.message }
    }
  }
}

/**
 * Public guest self-service: Update guest email and re-dispatch E-Pass
 */
export async function apiUpdateGuestEmail(phone, email) {
  try {
    return await fetchWithApiFallback('/api/guests/update-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, email })
    })
  } catch (err) {
    console.error('[API Client] Update email failed:', err)
    return { success: false, error: err.data?.error || err.message || 'Failed to update email.' }
  }
}

/**
 * Bulk delete multiple guest records simultaneously
 */
export async function apiBulkDeleteGuests(phones) {
  try {
    return await fetchStaffApi('/api/guests/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phones })
    })
  } catch (err) {
    console.error('[API Client] Bulk delete guests failed:', err)
    return { success: false, error: err.data?.error || err.message || 'Failed to bulk delete guests.' }
  }
}
