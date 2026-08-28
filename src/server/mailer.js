import dotenv from 'dotenv'
import QRCode from 'qrcode'
import nodemailer from 'nodemailer'
import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'
import { getLogoDataUrl, getAdBannerDataUrl } from './assets.js'

dotenv.config()

/**
 * SMTP Transactional Email Dispatcher for 707 Event E-Passes with PDF Attachment
 */
class MailerService {
  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'events@707.co.id'
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
   * Helper to format human-readable event day names
   */
  getValidForLines(dates, role = 'VIP GUEST') {
    let arr = Array.isArray(dates) ? dates : []
    if (typeof dates === 'string') {
      try {
        arr = JSON.parse(dates)
      } catch (e) {
        arr = dates.split(',').map(s => s.trim())
      }
    }
    const normalized = arr.map(k => String(k).toLowerCase().trim())
    const hasDay1 = normalized.some(k => k === 'day-1' || k === '1' || k.includes('day 1'))
    const publicDays = ['day-2', 'day-3', 'day-4', 'day-5'].filter(d => 
      normalized.some(k => k === d || k === d.replace('day-', '') || k === d.replace('-', ' '))
    )

    const lines = []
    if (hasDay1) {
      lines.push('VIP: DAY 1')
    }
    if (publicDays.length === 4) {
      lines.push('PUBLIC: ALL DAY')
    } else if (publicDays.length > 0) {
      const nums = publicDays.map(d => d.replace('day-', '')).join(', ')
      lines.push(`PUBLIC: DAY ${nums}`)
    }

    if (lines.length === 0) {
      lines.push((role || '').toUpperCase().includes('VIP') ? 'VIP: DAY 1' : 'PUBLIC: DAY 2')
    }
    return lines
  }

  formatDates(dates, role = 'VIP GUEST') {
    return this.getValidForLines(dates, role).join('<br>')
  }

  /**
   * Generate official PDF E-Pass Buffer with clickable promotional banner
   */
  async generatePassPdfBuffer({ guestName, accessId, role, selectedDates }) {
    const isVip = (role || '').toUpperCase().includes('VIP')
    const width = 402
    const height = 860

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [width, height]
    })

    // 1. Background Fill
    if (isVip) {
      doc.setFillColor(0, 0, 0)
    } else {
      doc.setFillColor(242, 242, 242)
    }
    doc.rect(0, 0, width, height, 'F')

    // 2. Logo (Infallible Data URL)
    try {
      const logoBase64 = getLogoDataUrl(isVip)
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 24, 15.5, 53, 17)
      }
    } catch (e) {
      console.warn('[PDF Gen]: Logo embed error:', e.message)
    }

    // 3. Title Row
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(18)
    if (isVip) {
      doc.setTextColor(255, 255, 255)
      doc.text('VIP GUEST', 24, 76)
      doc.setFont('Helvetica', 'normal')
      doc.text('YOUR ACCESS', 378, 76, { align: 'right' })
    } else {
      doc.setTextColor(0, 0, 0)
      doc.text('PUBLIC GUEST', 24, 76)
      doc.setFont('Helvetica', 'normal')
      doc.text('YOUR ACCESS', 378, 76, { align: 'right' })
    }

    // 4. QR Code Box
    doc.setFillColor(242, 242, 242)
    doc.roundedRect(24, 108, 195, 195, 5, 5, 'F')
    doc.setDrawColor(isVip ? 255 : 0, isVip ? 255 : 0, isVip ? 255 : 0)
    doc.setLineWidth(0.5)
    doc.roundedRect(24, 108, 195, 195, 5, 5, 'S')

    // Generate high-res QR code
    const qrDataUrl = await QRCode.toDataURL(accessId, {
      width: 500,
      margin: 0,
      color: { dark: '#000000', light: '#f2f2f2' }
    })
    doc.addImage(qrDataUrl, 'PNG', 37, 121, 169, 169)

    // 5. Identity Details
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(isVip ? 255 : 0, isVip ? 255 : 0, isVip ? 255 : 0)
    doc.text('GUEST NAME', 24, 344)
    doc.text('VENUE', 216, 344)

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(16)

    // Split name into lines if multi-word
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

    doc.text(line1, 24, 368)
    if (line2) {
      doc.text(line2, 24, 390)
    }

    doc.text('PLAZA SENAYAN', 216, 368)
    doc.text('4th FLOOR', 216, 390)

    // Row 2: Valid For & Access ID
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('VALID FOR', 24, 438)
    doc.text('ACCESS ID', 216, 438)

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(14)
    const validLines = this.getValidForLines(selectedDates, role)
    if (validLines.length === 1) {
      doc.text(validLines[0], 24, 462)
    } else {
      doc.text(validLines[0], 24, 458)
      doc.text(validLines[1], 24, 478)
    }
    doc.text(accessId, 216, 462)

    // 6. Promotional Banner with Clickable Hyperlink
    const promoLink = 'https://www.jenius.com/greenclubpromo/details/penawaran-jenius-707-ff-sale'
    try {
      const bannerBase64 = getAdBannerDataUrl()
      if (bannerBase64) {
        doc.addImage(bannerBase64, 'PNG', 24, 510, 354, 177)
        // Clickable URL Annotation in the PDF
        doc.link(24, 510, 354, 177, { url: promoLink })
      }
    } catch (e) {
      console.warn('[PDF Gen]: Banner embed error:', e.message)
    }

    // 7. Terms & Conditions
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('TERMS & CONDITIONS:', 24, 720)
    doc.setFontSize(10)
    doc.text('Valid for one (1) person only — non-transferable.', 24, 744)
    doc.text('Present this ticket at the entrance for scanning.', 24, 764)
    doc.text('No re-entry once you have exited the venue.', 24, 784)
    doc.text('Management is not liable for loss of personal belongings.', 24, 804)

    const arrayBuf = doc.output('arraybuffer')
    return Buffer.from(arrayBuf)
  }

  /**
   * Generate clean brutalist HTML email template matching 707 design
   */
  async buildPassEmailHtml({ guestName, accessId, role, selectedDates, bannerDataUrl }) {
    const isVip = (role || '').toUpperCase().includes('VIP')
    const badgeBg = isVip ? '#000000' : '#333333'
    const validDatesHtml = this.formatDates(selectedDates)
    const promoLink = 'https://www.jenius.com/greenclubpromo/details/penawaran-jenius-707-ff-sale'

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
      <div class="header-logo">707</div>
      <div><span class="badge">${isVip ? 'VIP GUEST' : 'PUBLIC ACCESS'}</span></div>
      <h1 class="title">SUCCESS. YOUR PASS HAS BEEN ISSUED.</h1>
      <p class="subtitle">
        Dear ${guestName},<br><br>
        Your registration is confirmed. Please find your official E-Pass attached to this email as a PDF document.
      </p>

      <div class="section-title">EVENT DETAILS</div>
      <table class="info-table">
        <tr class="info-row">
          <td class="info-label">VENUE</td>
          <td class="info-val">PLAZA SENAYAN — 4th FLOOR</td>
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
      Need assistance? Contact support at support@707.co.id or via WhatsApp at <a href="https://wa.me/6281277208270" style="color: #000000; font-weight: 600; text-decoration: underline;">+62 812-7720-8270</a>
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

    const isVip = (role || '').toUpperCase().includes('VIP')
    const pdfFilename = `FNF-2026-${isVip ? 'VIP' : 'PUBLIC'}-PASS-${accessId}.pdf`

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

    const subject = 'CONFIRMED: Your FNF 2026 707 Access Pass'

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
      const role = guest?.role || 'PUBLIC ACCESS'
      const selectedDates = reservation?.selected_dates || reservation?.selectedDates
      const phone = guest?.phone

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
