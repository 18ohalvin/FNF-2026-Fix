import dotenv from 'dotenv'
import QRCode from 'qrcode'
import nodemailer from 'nodemailer'
import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'
import { getLogoDataUrl, getOnLogoDataUrl, getOnLogoWhiteDataUrl, getEpassBgDataUrl, getAdBannerDataUrl } from './assets.js'
import { resolveArrivalSlots } from '../utils/dateHelper.js'

dotenv.config()

/**
 * SMTP Transactional Email Dispatcher for 707 Event E-Passes with PDF Attachment
 */
class MailerService {
  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'the707.co@sosco.id'
    this.fromName = process.env.SMTP_FROM_NAME || '707 Events'

    this.host = process.env.SMTP_HOST || ''
    this.port = Number(process.env.SMTP_PORT || 587)
    this.secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : this.port === 465
    this.user = process.env.SMTP_USER || ''
    this.pass = process.env.SMTP_PASS || ''

    this.transporter = this.host
      ? nodemailer.createTransport({
          host: this.host,
          port: this.port,
          secure: this.secure,
          auth: this.user ? { user: this.user, pass: this.pass } : undefined
        })
      : null
  }

  /**
   * Format selected date intervals into a clean string for emails/passes
   */
  formatDates(selectedDates) {
    if (!selectedDates || (Array.isArray(selectedDates) && selectedDates.length === 0)) {
      return 'ALL DAYS'
    }

    if (Array.isArray(selectedDates)) {
      return selectedDates.map(d => {
        const str = typeof d === 'string' ? d : `${d.date || ''} ${d.timeSlot || d.time || ''}`.trim()
        return str
      }).join('<br>')
    }

    if (typeof selectedDates === 'object') {
      return Object.entries(selectedDates)
        .map(([date, times]) => {
          const tStr = Array.isArray(times) ? times.join(', ') : times
          return `${date}: ${tStr}`
        })
        .join('<br>')
    }

    return String(selectedDates)
  }

  /**
   * Get clean text lines for PDF "VALID FOR"
   */
  getValidForLines(selectedDates, role) {
    if (!selectedDates || (Array.isArray(selectedDates) && selectedDates.length === 0)) {
      return ['ALL DAYS']
    }

    if (Array.isArray(selectedDates)) {
      return selectedDates.map(d => {
        if (typeof d === 'string') return d
        return `${d.date || ''} ${d.timeSlot || d.time || ''}`.trim()
      })
    }

    return ['ALL DAYS']
  }

  /**
   * Generate official PDF E-Pass Buffer matching Figma 540:419
   */
  async generatePassPdfBuffer({ guestName, accessId, role, selectedDates }) {
    const slots = resolveArrivalSlots(selectedDates)
    
    // Group slots by date
    const groups = []
    const map = new Map()

    slots.forEach(slot => {
      let dStr = '19 SEPT 2026'
      if (slot.dateId === '20-sep' || slot.dateIso === '2026-09-20' || slot.id?.startsWith('20sep') || slot.date?.startsWith('20')) {
        dStr = '20 SEPT 2026'
      } else if (slot.dateId === '19-sep' || slot.dateIso === '2026-09-19' || slot.id?.startsWith('19sep') || slot.date?.startsWith('19')) {
        dStr = '19 SEPT 2026'
      } else if (slot.date) {
        dStr = slot.date.toUpperCase()
      }

      if (!map.has(dStr)) {
        const g = { date: dStr, slots: [] }
        map.set(dStr, g)
        groups.push(g)
      }
      map.get(dStr).slots.push(slot)
    })

    // Ensure chronological order: 19 SEPT then 20 SEPT
    groups.sort((a, b) => {
      if (a.date.includes('19') && b.date.includes('20')) return -1
      if (a.date.includes('20') && b.date.includes('19')) return 1
      return 0
    })

    let totalSlots = 0
    groups.forEach(g => { totalSlots += g.slots.length })
    const baseHeight = 680 + (groups.length * 28) + (totalSlots * 56)
    const height = Math.max(760, baseHeight)
    const width = 402

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [width, height]
    })

    // 1. Background Fill / Artwork
    try {
      const bgDataUrl = getEpassBgDataUrl()
      if (bgDataUrl) {
        doc.addImage(bgDataUrl, 'PNG', 0, 0, width, height)
      } else {
        doc.setFillColor(74, 37, 27)
        doc.rect(0, 0, width, height, 'F')
      }
    } catch (e) {
      doc.setFillColor(74, 37, 27)
      doc.rect(0, 0, width, height, 'F')
    }

    // 2. Logo 707 on top right (w: 52, h: 16) - Pure White
    try {
      const logoBase64 = getLogoDataUrl(true)
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 326, 24, 52, 16)
      }
    } catch (e) {
      console.warn('[PDF Gen]: Logo embed error:', e.message)
    }

    // 3. On Brand Logo on left (w: 30, h: 61) - Pure White
    try {
      const onLogoBase64 = getOnLogoWhiteDataUrl()
      if (onLogoBase64) {
        doc.addImage(onLogoBase64, 'PNG', 24, 56, 30, 61)
      }
    } catch (e) {
      console.warn('[PDF Gen]: On logo embed error:', e.message)
    }

    // 4. QR Code Box (X: 24, Y: 133, Size: 156, Radius: 5)
    doc.setFillColor(242, 242, 242)
    doc.roundedRect(24, 133, 156, 156, 5, 5, 'F')
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.roundedRect(24, 133, 156, 156, 5, 5, 'S')

    // Generate high-res QR code
    const qrDataUrl = await QRCode.toDataURL(accessId, {
      width: 500,
      margin: 0,
      color: { dark: '#000000', light: '#f2f2f2' }
    })
    doc.addImage(qrDataUrl, 'PNG', 34, 143, 136, 136)

    // 5. Identity Details in White (Side-by-side with QR)
    const infoX = 208
    doc.setTextColor(255, 255, 255)

    // GUEST NAME
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('GUEST NAME', infoX, 148)

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(16)
    const parts = (guestName || 'GUEST').split(/\s+/).filter(Boolean)
    let line1 = guestName
    let line2 = ''
    if (parts.length === 2) {
      line1 = parts[0]
      line2 = parts[1]
    } else if (parts.length > 2) {
      line1 = parts.slice(0, parts.length - 1).join(' ')
      line2 = parts[parts.length - 1]
    }
    doc.text(line1, infoX, 172)
    if (line2) {
      doc.text(line2, infoX, 192)
    }

    // VENUE
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('VENUE', infoX, 230)

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('LA MODA PLAZA', infoX, 254)
    doc.text('INDONESIA', infoX, 274)

    // 6. VALID FOR Section
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('VALID FOR', 24, 320)

    let curY = 346
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      // Date Title
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(group.date, 24, curY)
      curY += 16

      // Slot Cards
      for (const slot of group.slots) {
        doc.setDrawColor(255, 255, 255)
        doc.setLineWidth(1)
        doc.rect(24, curY, 354, 48, 'S')

        // Time on Left
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(14)
        doc.text(slot.time, 48, curY + 29)

        // Session on Right
        if (slot.sessionSub) {
          doc.setFont('Helvetica', 'normal')
          doc.setFontSize(14)
          doc.text(slot.session || 'GUIDED SESSION LED', 354, curY + 20, { align: 'right' })
          doc.setFontSize(12)
          doc.text(slot.sessionSub, 354, curY + 36, { align: 'right' })
        } else if (slot.session) {
          doc.setFont('Helvetica', 'normal')
          doc.setFontSize(14)
          doc.text(slot.session, 354, curY + 29, { align: 'right' })
        }

        curY += 56
      }
      curY += (i < groups.length - 1) ? 28 : 16
    }

    // 7. Terms & Conditions
    curY += 16
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('TERMS & CONDITIONS:', 24, curY)

    curY += 20
    doc.setFontSize(11)
    doc.text('Valid for one (1) person only — non-transferable.', 24, curY)
    doc.text('Present this ticket at the entrance for scanning.', 24, curY + 16)
    doc.text('No re-entry once you have exited the venue.', 24, curY + 32)
    doc.text('Management is not liable for loss of personal belongings.', 24, curY + 48)

    const arrayBuf = doc.output('arraybuffer')
    return Buffer.from(arrayBuf)
  }

  /**
   * Generate clean brutalist HTML email template matching 707 design
   */
  async buildPassEmailHtml({ guestName, accessId, role, selectedDates, bannerDataUrl, logoDataUrl }) {
    const isVip = (role || '').toUpperCase().includes('VIP')
    const badgeBg = isVip ? '#000000' : '#333333'
    const validDatesHtml = this.formatDates(selectedDates)
    const promoLink = 'https://www.jenius.com/greenclubpromo/details/penawaran-jenius-707-ff-sale'
    const logoSrc = logoDataUrl || getLogoDataUrl(false)

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
    .header-logo-container { margin-bottom: 24px; }
    .header-logo-img { height: 24px; width: auto; max-height: 24px; display: block; border: 0; outline: none; text-decoration: none; }
    .badge { display: inline-block; background-color: ${badgeBg}; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; margin: 0 0 8px 0; color: #000000; }
    .subtitle { font-size: 14px; color: #666666; margin: 0 0 24px 0; line-height: 1.5; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #000000; border-top: 1px solid #eeeeee; padding-top: 16px; margin-top: 8px; margin-bottom: 4px; }
    .info-table { width: 100%; margin-bottom: 24px; }
    .info-row td { padding: 12px 0; border-bottom: 1px solid #eeeeee; vertical-align: top; }
    .info-label { font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 0.05em; width: 35%; }
    .info-val { font-size: 14px; font-weight: 600; color: #000000; }
    .banner-container { margin: 24px 0; text-align: center; }
    .banner-img { max-width: 100%; width: 100%; height: auto; border: 0; display: block; border-radius: 4px; }
    .terms { font-size: 11px; color: #777777; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 16px; margin-top: 24px; }
    .signoff { font-size: 14px; color: #000000; line-height: 1.6; margin-top: 24px; }
    .footer { font-size: 12px; color: #999999; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div style="padding: 16px;">
    <div class="card">
      <div class="header-logo-container">
        <img src="${logoSrc}" alt="707 Logo" class="header-logo-img" />
      </div>
      <div><span class="badge">GUEST ACCESS</span></div>
      <h1 class="title">SUCCESS. YOUR PASS HAS BEEN ISSUED.</h1>
      <p class="subtitle">
        Dear ${guestName},<br><br>
        Your registration is confirmed. Please find your official E-Pass attached to this email as a PDF document.
      </p>

      <div class="section-title">EVENT DETAILS</div>
      <table class="info-table">
        <tr class="info-row">
          <td class="info-label">VENUE</td>
          <td class="info-val">LA MODA PLAZA INDONESIA</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">VALID FOR</td>
          <td class="info-val">${validDatesHtml}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">ACCESS ID</td>
          <td class="info-val">${accessId}</td>
        </tr>
      </table>

      ${bannerDataUrl ? `
      <div class="banner-container">
        <a href="${promoLink}" target="_blank" rel="noopener noreferrer">
          <img src="${bannerDataUrl}" alt="Nikmati promo spesial dari Jenius!" class="banner-img" />
        </a>
      </div>
      ` : ''}

      <div class="terms">
        <strong>ENTRY INSTRUCTIONS:</strong><br>
        Please download the attached PDF to your device before arriving. You must present the QR code on the attachment at the entrance for scanning. Ensure your screen brightness is turned up for faster entry.
        <br><br>
        Please note: The attached QR code serves as your universal access pass. If you have registered for multiple days, you will use this exact same QR code for every day of your visit. You will not receive separate tickets.
      </div>

      <p class="signoff">
        We look forward to seeing you.<br>
        <strong>— 707 Team</strong>
      </p>
    </div>
    <div class="footer">
      © 2026 707 Event Management. All rights reserved.<br>
      Need assistance? Contact support at the707.co@sosco.id or via WhatsApp at <a href="https://wa.me/6281277208270" style="color: #000000; font-weight: 600; text-decoration: underline;">+62 812-7720-8270</a>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Send Transactional Email via SMTP with PDF Attachment
   */
  async sendTransactionalPass({ guestName, accessId, role, selectedDates, email, phone }) {
    if (!email) {
      console.warn('[Mailer]: No recipient email provided. Skipping email delivery.')
      return { success: false, reason: 'Missing email' }
    }

    const pdfFilename = `707-PASS-${accessId}.pdf`

    // 1. Load promo banner for email HTML (Infallible Data URL)
    const bannerDataUrl = getAdBannerDataUrl()

    // 2. Generate PDF Pass Buffer
    let pdfBuffer = null
    try {
      pdfBuffer = await this.generatePassPdfBuffer({
        guestName,
        accessId,
        role,
        selectedDates
      })
    } catch (pdfErr) {
      console.error('[Mailer]: Failed to generate PDF pass attachment:', pdfErr)
    }

    const htmlContent = await this.buildPassEmailHtml({
      guestName,
      accessId,
      role,
      selectedDates,
      bannerDataUrl
    })

    const subject = 'CONFIRMED: Your 707 Access Pass'

    // If SMTP is configured
    if (this.transporter) {
      try {
        const mailOptions = {
          from: `"${this.fromName}" <${this.fromEmail}>`,
          to: `"${guestName}" <${email}>`,
          replyTo: this.fromEmail,
          subject,
          html: htmlContent,
          attachments: pdfBuffer ? [
            {
              filename: pdfFilename,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ] : []
        }

        const result = await this.transporter.sendMail(mailOptions)

        console.log(`[SMTP Mailer 🚀]: Successfully sent E-Pass (PDF attached) to ${email} (Access ID: ${accessId})`)
        return { success: true, provider: 'smtp', result: { messageId: result.messageId } }
      } catch (err) {
        console.error('[SMTP Mailer Error]:', err.message)
        return { success: false, provider: 'smtp', error: err.message }
      }
    }

    // Development / Simulated Delivery Fallback
    console.log(`[Mailer (Simulated) ✉️]: E-Pass (PDF generated) queued & sent for ${guestName} <${email}> (Access ID: ${accessId}, Role: ${role})`)
    return {
      success: true,
      provider: 'simulated',
      recipient: email,
      accessId,
      hasPdf: Boolean(pdfBuffer),
      note: 'SMTP_HOST not configured; simulated delivery.'
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
      const role = guest?.role || 'GUEST'
      const selectedDates = reservation?.selected_dates || reservation?.selectedDates
      const phone = guest?.phone

      // Push email is currently deactivated as requested, preserving all functions for future activation
      const isEmailPushActive = process.env.ENABLE_EMAIL_DISPATCH === 'true'
      if (!isEmailPushActive) {
        console.log(`[Mailer (Deactivated) ⏸️]: Push email is deactivated. Guest (${guestName}) can download E-Pass directly.`)
        return { success: true, deactivated: true, note: 'Push email is currently deactivated. Guests can download pass directly.' }
      }

      // Send E-Pass Email
      const sendResult = await this.sendTransactionalPass({
        guestName,
        accessId,
        role,
        selectedDates,
        email,
        phone
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
