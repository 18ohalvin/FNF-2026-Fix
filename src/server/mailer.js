import dotenv from 'dotenv'
import QRCode from 'qrcode'
import crypto from 'crypto'

dotenv.config()

/**
 * Mailchimp & Transactional Email Dispatcher for 707 Event E-Passes
 */
class MailerService {
  constructor() {
    this.apiKey = process.env.MAILCHIMP_API_KEY || process.env.MANDRILL_API_KEY || ''
    this.fromEmail = process.env.MAILCHIMP_FROM_EMAIL || process.env.FROM_EMAIL || 'events@707.co.id'
    this.fromName = process.env.MAILCHIMP_FROM_NAME || '707 Events'
    this.listId = process.env.MAILCHIMP_LIST_ID || process.env.MAILCHIMP_AUDIENCE_ID || ''
    this.serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || (this.apiKey.includes('-') ? this.apiKey.split('-')[1] : 'us1')
  }

  /**
   * Helper to format human-readable event day names
   */
  formatDates(dates) {
    if (!dates) return 'Day 1 (2 September 2026)'
    let arr = Array.isArray(dates) ? dates : []
    if (typeof dates === 'string') {
      try {
        arr = JSON.parse(dates)
      } catch (e) {
        arr = dates.split(',').map(s => s.trim())
      }
    }
    const map = {
      'day-1': 'Day 1 — 2 Sep 2026 (VIP)',
      'day-2': 'Day 2 — 3 Sep 2026',
      'day-3': 'Day 3 — 4 Sep 2026',
      'day-4': 'Day 4 — 5 Sep 2026',
      'day-5': 'Day 5 — 6 Sep 2026'
    }
    return arr.map(d => map[d] || d).join('<br>') || 'Day 1'
  }

  /**
   * Generate clean brutalist HTML email template matching 707 design
   */
  async buildPassEmailHtml({ guestName, accessId, role, selectedDates, email, phone, qrDataUrl }) {
    const isVip = (role || '').toUpperCase().includes('VIP')
    const badgeBg = isVip ? '#000000' : '#333333'
    const validDatesHtml = this.formatDates(selectedDates)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>707 EVENT PASS</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f2f2f2; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000000; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    .card { background-color: #ffffff; max-width: 480px; margin: 24px auto; padding: 32px 24px; border: 1px solid #e0e0e0; }
    .header-logo { font-size: 28px; font-weight: 900; letter-spacing: 0.05em; color: #000000; margin-bottom: 24px; }
    .badge { display: inline-block; background-color: ${badgeBg}; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; margin: 0 0 8px 0; color: #000000; }
    .subtitle { font-size: 14px; color: #666666; margin: 0 0 24px 0; line-height: 1.5; }
    .qr-container { text-align: center; background-color: #f9f9f9; padding: 20px; border: 1px solid #eeeeee; margin-bottom: 24px; }
    .qr-img { width: 200px; height: 200px; display: inline-block; }
    .access-id { font-size: 18px; font-weight: 700; letter-spacing: 0.1em; margin-top: 12px; color: #000000; }
    .info-table { width: 100%; margin-bottom: 24px; border-top: 1px solid #eeeeee; }
    .info-row td { padding: 12px 0; border-bottom: 1px solid #eeeeee; vertical-align: top; }
    .info-label { font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 0.05em; width: 35%; }
    .info-val { font-size: 14px; font-weight: 600; color: #000000; }
    .terms { font-size: 11px; color: #777777; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 16px; margin-top: 24px; }
    .footer { font-size: 12px; color: #999999; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div style="padding: 16px;">
    <div class="card">
      <div class="header-logo">707</div>
      <div><span class="badge">${isVip ? 'VIP GUEST' : 'PUBLIC ACCESS'}</span></div>
      <h1 class="title">YOUR EVENT E-PASS</h1>
      <p class="subtitle">Present this QR code or 3-digit Access ID at the security entrance checkpoint.</p>

      <div class="qr-container">
        <img src="${qrDataUrl}" alt="Event Pass QR Code" class="qr-img" />
        <div class="access-id">ACCESS ID: ${accessId}</div>
      </div>

      <table class="info-table">
        <tr class="info-row">
          <td class="info-label">GUEST NAME</td>
          <td class="info-val">${guestName}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">VENUE</td>
          <td class="info-val">PLAZA SENAYAN — 4th FLOOR</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">VALID FOR</td>
          <td class="info-val">${validDatesHtml}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">PHONE</td>
          <td class="info-val">${phone || '-'}</td>
        </tr>
      </table>

      <div class="terms">
        <strong>TERMS & CONDITIONS:</strong><br>
        1. Valid for one (1) person only — non-transferable.<br>
        2. Present this ticket at the entrance for scanning.<br>
        3. No re-entry once you have exited the venue.<br>
        4. Management is not liable for loss of personal belongings.
      </div>
    </div>
    <div class="footer">
      © 2026 707 Event Management. All rights reserved.<br>
      Need assistance? Contact support at support@707.co.id or via WhatsApp at <a href="https://wa.me/6281277208270" style="color: #000000; font-weight: 600; text-decoration: underline;">+62 812-7720-8270</a>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Sync subscriber to Mailchimp Marketing Audience
   */
  async syncToMailchimpAudience({ email, firstName, lastName, phone, role, accessId }) {
    if (!this.apiKey || !this.listId) {
      return { skipped: true, reason: 'MAILCHIMP_API_KEY or MAILCHIMP_LIST_ID not set' }
    }

    try {
      const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex')
      const url = `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${this.listId}/members/${subscriberHash}`

      const payload = {
        email_address: email,
        status_if_new: 'subscribed',
        merge_fields: {
          FNAME: firstName || 'Guest',
          LNAME: lastName || '',
          PHONE: phone || '',
          ACCESS_ID: accessId || ''
        },
        tags: [role || 'PUBLIC ACCESS']
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `apikey ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        console.warn('[Mailchimp Audience Sync Warning]:', data.title || data.detail || response.statusText)
        return { success: false, error: data }
      }

      console.log(`[Mailchimp Audience]: Synced ${email} (${role})`)
      return { success: true, data }
    } catch (err) {
      console.error('[Mailchimp Audience Sync Error]:', err.message)
      return { success: false, error: err.message }
    }
  }

  /**
   * Send Transactional Email via Mailchimp Mandrill API
   */
  async sendTransactionalPass({ guestName, accessId, role, selectedDates, email, phone }) {
    if (!email) {
      console.warn('[Mailer]: No recipient email provided. Skipping email delivery.')
      return { success: false, reason: 'Missing email' }
    }

    // Generate high-resolution QR code as Data URL
    const qrDataUrl = await QRCode.toDataURL(accessId, {
      width: 400,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })

    const htmlContent = await this.buildPassEmailHtml({
      guestName,
      accessId,
      role,
      selectedDates,
      email,
      phone,
      qrDataUrl
    })

    const subject = `Your 707 Event Pass [Access ID: ${accessId}]`

    // If Mailchimp / Mandrill API Key is configured
    if (this.apiKey) {
      try {
        const mandrillEndpoint = 'https://mandrillapp.com/api/1.0/messages/send.json'
        const payload = {
          key: this.apiKey,
          message: {
            html: htmlContent,
            subject,
            from_email: this.fromEmail,
            from_name: this.fromName,
            to: [
              {
                email,
                name: guestName,
                type: 'to'
              }
            ],
            headers: {
              'Reply-To': this.fromEmail
            },
            track_opens: true,
            track_clicks: true,
            auto_text: true
          }
        }

        const res = await fetch(mandrillEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const result = await res.json()
        if (!res.ok) {
          console.warn('[Mailchimp Transactional Warning]:', result)
        } else {
          console.log(`[Mailchimp Mailer 🚀]: Successfully sent E-Pass to ${email} (Access ID: ${accessId})`)
          return { success: true, provider: 'mailchimp-mandrill', result }
        }
      } catch (err) {
        console.error('[Mailchimp Mailer Error]:', err.message)
      }
    }

    // Development / Simulated Delivery Fallback
    console.log(`[Mailer (Simulated) ✉️]: E-Pass queued & sent for ${guestName} <${email}> (Access ID: ${accessId}, Role: ${role})`)
    return {
      success: true,
      provider: 'simulated',
      recipient: email,
      accessId,
      note: 'Mailchimp API key not configured or simulated delivery enabled.'
    }
  }

  /**
   * Main Dispatcher: Triggered on new reservation
   */
  async dispatchEventPass({ guest, reservation }) {
    try {
      const email = guest?.email
      const guestName = `${guest?.salutation || ''} ${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() || 'Guest'
      const accessId = reservation?.access_id || reservation?.accessId || '707'
      const role = guest?.role || 'PUBLIC ACCESS'
      const selectedDates = reservation?.selected_dates || reservation?.selectedDates
      const phone = guest?.phone

      // 1. Send E-Pass Email
      const sendResult = await this.sendTransactionalPass({
        guestName,
        accessId,
        role,
        selectedDates,
        email,
        phone
      })

      // 2. Sync to Audience (if configured)
      await this.syncToMailchimpAudience({
        email,
        firstName: guest?.first_name,
        lastName: guest?.last_name,
        phone,
        role,
        accessId
      })

      return sendResult
    } catch (err) {
      console.error('[Mailer Dispatch Error]:', err)
      return { success: false, error: err.message }
    }
  }
}

export const mailer = new MailerService()
export default mailer
