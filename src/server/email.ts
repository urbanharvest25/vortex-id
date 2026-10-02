import { db } from './db.js';
import { Order, Invoice } from '../types/index.js';

export interface EmailSendResult {
  success: boolean;
  status: 'SENT' | 'FAILED' | 'PENDING';
  messageId?: string;
  error?: string;
}

export function isEmailConfigured(): { configured: boolean; provider: string; from: string } {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').trim().toLowerCase();
  const apiKey = (process.env.EMAIL_API_KEY || '').trim();
  const from = (process.env.EMAIL_FROM || 'onboarding@resend.dev').trim();
  const configured = Boolean(apiKey.length > 0);
  return { configured, provider, from };
}

export async function sendEmailWithResend(
  to: string,
  subject: string,
  html: string,
  orderId?: string
): Promise<EmailSendResult> {
  const { configured, from } = isEmailConfigured();
  const apiKey = (process.env.EMAIL_API_KEY || '').trim();
  const fromName = (process.env.EMAIL_FROM_NAME || 'Vortex ID').trim();
  const formattedFrom = from.includes('<') ? from : `${fromName} <${from}>`;

  if (!configured) {
    const errorMsg =
      'Email provider belum dikonfigurasi di environment variable (EMAIL_API_KEY masih kosong).';
    db.logEmail(to, subject, 'FAILED', errorMsg, orderId);
    return {
      success: false,
      status: 'FAILED',
      error: errorMsg,
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: formattedFrom,
        to: [to],
        subject,
        html,
      }),
    });

    const resData = (await res.json()) as any;
    if (res.ok && resData.id) {
      db.logEmail(to, subject, 'SENT', undefined, orderId);
      return { success: true, status: 'SENT', messageId: resData.id };
    } else {
      const errMsg = resData.message || res.statusText || 'Gagal mengirim email via Resend API';
      db.logEmail(to, subject, 'FAILED', errMsg, orderId);
      return { success: false, status: 'FAILED', error: errMsg };
    }
  } catch (err: any) {
    const errorMsg = err.message || 'Terjadi kesalahan jaringan saat mengirim email via Resend';
    db.logEmail(to, subject, 'FAILED', errorMsg, orderId);
    return { success: false, status: 'FAILED', error: errorMsg };
  }
}

export async function sendTestEmail(recipientEmail: string): Promise<EmailSendResult> {
  const subject = `[Vortex ID] Uji Coba Integrasi Resend Berhasil`;
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e17; color: #f8fafc; padding: 28px; border-radius: 12px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #00f0ff; margin: 0; font-size: 28px; letter-spacing: 2px;">VORTEX ID</h1>
        <p style="color: #94a3b8; margin: 4px 0 0 0; font-style: italic;">Beli Aman, Main Nyaman.</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />

      <h3 style="color: #10b981; margin-top: 0;">✓ Integrasi Resend Server-Side Berhasil!</h3>
      <p style="line-height: 1.6; color: #cbd5e1;">
        Email ini dikirim secara otomatis melalui server-side Resend API untuk memverifikasi bahwa konfigurasi email toko <strong>Vortex ID</strong> telah aktif dan berfungsi normal.
      </p>

      <div style="background: #111827; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00f0ff;">
        <p style="margin: 4px 0;"><strong>Penerima:</strong> <span style="color: #00f0ff;">${recipientEmail}</span></p>
        <p style="margin: 4px 0;"><strong>Waktu Pengujian:</strong> ${timestamp} WIB</p>
        <p style="margin: 4px 0;"><strong>Status Layanan:</strong> <span style="color: #10b981;">OPERATIONAL / SIAP PRODUKSI</span></p>
      </div>

      <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #1e293b; padding-top: 16px; text-align: center;">
        <p style="margin: 4px 0;">WhatsApp Resmi: <strong>085819822250</strong></p>
        <p style="margin: 4px 0;">© 2026 Vortex ID - Marketplace Akun Gaming Terpercaya</p>
      </div>
    </div>
  `;
  return sendEmailWithResend(recipientEmail, subject, html);
}

export async function sendOrderNotificationEmail(
  order: Order,
  invoice: Invoice,
  recipientEmail: string
): Promise<EmailSendResult> {
  const subject = `[Vortex ID] Nota Pesanan #${order.invoice_number} - ${order.customer_name}`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.product_name} (${item.product_game})</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">Rp${item.price.toLocaleString('id-ID')}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e17; color: #f8fafc; padding: 24px; border-radius: 8px;">
      <h2 style="color: #00f0ff; margin-top: 0;">VORTEX ID</h2>
      <p style="color: #94a3b8; font-style: italic;">Beli Aman, Main Nyaman.</p>
      <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
      
      <h3>Halo, ${order.customer_name}!</h3>
      <p>Terima kasih telah bertransaksi di Vortex ID. Berikut rincian pesanan Anda:</p>
      
      <div style="background: #111827; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Nomor Invoice:</strong> <span style="color: #00f0ff;">${order.invoice_number}</span></p>
        <p style="margin: 4px 0;"><strong>Nomor Transaksi:</strong> ${order.order_number}</p>
        <p style="margin: 4px 0;"><strong>Status Pesanan:</strong> ${order.order_status}</p>
        <p style="margin: 4px 0;"><strong>Metode Pembayaran:</strong> ${order.payment_method}</p>
        <p style="margin: 4px 0;"><strong>Total Pembayaran:</strong> <strong style="color: #10b981;">Rp${order.total.toLocaleString('id-ID')}</strong></p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="background: #1e293b; color: #f8fafc;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Jumlah</th>
            <th style="padding: 8px; text-align: right;">Harga</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-top: 24px; font-size: 13px; color: #94a3b8; line-height: 1.6;">
        <p>Silakan pantau status pesanan Anda melalui menu <strong>Pesanan</strong> di website Vortex ID.</p>
        <p>Butuh bantuan? Hubungi WhatsApp resmi kami di <strong>085819822250</strong>.</p>
      </div>
    </div>
  `;

  return sendEmailWithResend(recipientEmail, subject, htmlContent, order.id);
}
