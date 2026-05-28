import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = `Sun Medical <${process.env.EMAIL_USER}>`;

const REASON_LABELS = {
  ROUTINE_CHECK:        "Control de rutină",
  PRESCRIPTION_RENEWAL: "Reînnoire rețetă",
  SICK_VISIT:           "Consultație boală",
  LAB_RESULTS:          "Rezultate analize",
  VACCINATION:          "Vaccinare",
  ADMINISTRATIVE:       "Administrativ",
};

function formatDateTime(date) {
  return new Date(date).toLocaleString("ro-RO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function baseHtml(title, content) {
  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:28px 32px;">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">Sun Medical</p>
          <p style="margin:4px 0 0;color:#ccfbf1;font-size:13px;">${title}</p>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
            Acesta este un mesaj automat. Vă rugăm să nu răspundeți la acest email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── 1. Confirmare programare ──────────────────────────────────
export async function sendAppointmentConfirmation({ to, patientName, doctorName, scheduledAt, reason }) {
  const dateStr = formatDateTime(scheduledAt);
  const reasonStr = REASON_LABELS[reason] ?? reason ?? "Nespecificat";

  const content = `
    <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Bună ziua, <strong>${patientName}</strong>!</p>
    <p style="margin:0 0 24px;color:#475569;">Programarea dumneavoastră a fost confirmată cu succes. Mai jos găsiți detaliile:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;width:120px;">📅 Data și ora</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:600;font-size:14px;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;">👨‍⚕️ Medic</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:600;font-size:14px;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;">📋 Motiv</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:600;font-size:14px;">${reasonStr}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0;color:#475569;font-size:14px;">Vă rugăm să fiți prezenți cu <strong>10 minute înainte</strong> de ora programată.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Confirmare programare – ${dateStr}`,
    html: baseHtml("Confirmare programare", content),
  });
  console.log(`[Email] Confirmare trimisă → ${to}`);
}

// ─── 2. Reminder programare (24h înainte) ─────────────────────
export async function sendAppointmentReminder({ to, patientName, doctorName, scheduledAt, reason }) {
  const dateStr = formatDateTime(scheduledAt);
  const reasonStr = REASON_LABELS[reason] ?? reason ?? "Nespecificat";

  const content = `
    <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Bună ziua, <strong>${patientName}</strong>!</p>
    <p style="margin:0 0 24px;color:#475569;">Vă reamintim că mâine aveți o programare la cabinet. Detalii:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;width:120px;">📅 Data și ora</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:600;font-size:14px;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;">👨‍⚕️ Medic</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:600;font-size:14px;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;">📋 Motiv</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:600;font-size:14px;">${reasonStr}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0;color:#475569;font-size:14px;">Dacă nu puteți ajunge, vă rugăm să anulați programarea din aplicație.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Reminder programare mâine – ${dateStr}`,
    html: baseHtml("Reminder programare", content),
  });
  console.log(`[Email] Reminder trimis → ${to}`);
}

// ─── 3. Email anunț ────────────────────────────────────────────
export async function sendAnnouncementEmail({ to, title, content: announcementContent }) {
  const content = `
    <p style="margin:0 0 24px;color:#475569;">A fost publicat un anunț nou din partea cabinetului:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:700;">${title}</p>
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">${announcementContent.replace(/\n/g, "<br>")}</p>
      </td></tr>
    </table>
    <p style="margin:0;color:#475569;font-size:14px;">Puteți vedea toate anunțurile în aplicație.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Anunț nou: ${title}`,
    html: baseHtml("Anunț cabinet", content),
  });
}
