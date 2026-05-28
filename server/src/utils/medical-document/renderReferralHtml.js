const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function dotLine(label, value, width = "100%") {
  const val = esc(value);
  return `
    <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:5px;">
      <span style="white-space:nowrap;font-size:10px;">${esc(label)}</span>
      <span style="flex:1;border-bottom:1px solid #555;min-width:40px;display:inline-block;">&nbsp;${val}</span>
    </div>`;
}

function checkbox(checked) {
  return `<span style="display:inline-block;width:12px;height:12px;border:1px solid #333;margin-right:3px;text-align:center;line-height:12px;font-size:9px;">${checked ? "✓" : ""}</span>`;
}

export function renderReferralHtml(document) {
  const content     = document.finalContent ?? {};
  const header      = content.header           ?? {};
  const patient     = content.patientSection   ?? {};
  const doctor      = content.doctorSection    ?? {};
  const referral    = content.referralSection  ?? {};
  const consult     = content.consultationSection ?? {};
  const footer      = content.footer           ?? {};
  const overrides   = document.overrides       ?? {};

  // ── Cabinet ───────────────────────────────────────────────────
  const unitateSanitara = esc(overrides.unitateSanitara || header.unitateSanitara || "");
  const adresaCabinet   = esc(overrides.adresaCabinet   || header.adresaCabinet   || "");
  const seria = esc(overrides.seria || header.seria || header.serialPrefix || "");
  const nr    = esc(overrides.nr    || header.nr    || "");

  // ── Doctor ────────────────────────────────────────────────────
  const doctorNume         = esc(overrides.doctorNume         || doctor.fullName       || "");
  const doctorCod          = esc(overrides.doctorCod          || doctor.parafaCode     || "");
  const doctorSpecializare = esc(overrides.doctorSpecializare || doctor.specialization || "");
  const includeSignature = overrides.includeSignature !== false;
  const signatureUrl = includeSignature
    ? (overrides.signatureUrl || doctor.signatureUrl || null)
    : null;

  // ── Patient ───────────────────────────────────────────────────
  const patientNume    = esc(patient.fullName?.split(" ").slice(1).join(" ") || "");
  const patientPrenume = esc(patient.fullName?.split(" ")[0] || "");
  const patientCnp     = esc(overrides.patientCnp || patient.cnp  || "");
  const patientAge     = esc(patient.age || "");
  const patientPhone   = esc(patient.phone || "");
  const codCardAsigurat   = esc(overrides.codCardAsigurat || "");
  const codDiagnostic     = esc(overrides.codDiagnostic   || "");
  const categoriiSelectate = Array.isArray(overrides.categorieAsigurat) ? overrides.categorieAsigurat : [];

  // ── Referral ──────────────────────────────────────────────────
  const specialty       = esc(referral.specialty       || "");
  const reason          = esc(referral.reason          || "");
  const clinicalSummary = esc(referral.clinicalSummary || "");
  const destinationUnit = esc(referral.destinationUnit || "");
  const notes           = esc(referral.notes           || "");
  const isUrgent        = referral.priority === "URGENT";

  // ── Diagnostic ────────────────────────────────────────────────
  const diagnostic = esc(overrides.diagnostic || consult.diagnosis || "");

  // ── Data ──────────────────────────────────────────────────────
  let issuedDate;
  if (!header.issuedAt) {
    issuedDate = new Date().toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  } else {
    const parsed = new Date(header.issuedAt);
    issuedDate = isNaN(parsed.getTime())
      ? String(header.issuedAt)
      : parsed.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  // ── Imagini ───────────────────────────────────────────────────
  const signatureImgHtml = signatureUrl
    ? `<img src="${BASE_URL}${signatureUrl}" style="max-height:80px;max-width:200px;display:block;margin-bottom:2px;" alt="Semnătură și parafă" />`
    : `<div style="border-top:1px solid #333;width:150px;margin-top:40px;margin-bottom:2px;"></div>`;

  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8"/>
  <title>Bilet de trimitere</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#111;background:white;padding:20px 28px}
    table{width:100%;border-collapse:collapse}
    td,th{border:1px solid #555;padding:4px 6px;vertical-align:top;font-size:10px}
    th{background:#f0f0f0;font-weight:bold;text-align:center}
    .no-border td{border:none;padding:2px 4px}
    .section-title{font-size:11px;font-weight:bold;background:#e8e8e8;padding:3px 6px;border:1px solid #555;margin-top:0}
    .dotline{border-bottom:1px solid #555;display:inline-block;min-width:60px;}
    h1{font-size:13px;font-weight:bold;text-align:center;margin-bottom:2px}
    .subtitle{font-size:10px;text-align:center;margin-bottom:10px;color:#444}
  </style>
</head>
<body>

  <!-- Titlu -->
  <h1>BILET DE TRIMITERE</h1>
  <div class="subtitle">pentru investigații și consultații de specialitate</div>

  <!-- 1. Unitate medicală + Seria + Prioritate -->
  <table style="margin-bottom:6px;">
    <tr>
      <td style="width:55%">
        <div style="font-weight:bold;font-size:10px;margin-bottom:3px;">1. Unitate medicală</div>
        ${dotLine("", unitateSanitara)}
        ${dotLine("Sediu:", adresaCabinet)}
        ${dotLine("Tel.:", esc(overrides.phoneCabinet || header.phoneCabinet || ""))}
      </td>
      <td style="width:20%;text-align:center;vertical-align:middle;">
        <div style="font-size:10px;margin-bottom:4px;">
          ${checkbox(false)} MF &nbsp;&nbsp; ${checkbox(true)} Amb.<br/>
          ${checkbox(false)} Spec. &nbsp; ${checkbox(false)} Altele
        </div>
      </td>
      <td style="width:25%;text-align:center;vertical-align:middle;">
        <div style="font-size:10px;font-weight:bold;margin-bottom:3px;">Nivel de prioritate</div>
        <div style="border:1px solid #555;padding:3px;font-weight:bold;font-size:11px;background:${isUrgent ? "#ffeeee" : "#eeffee"}">
          ${isUrgent ? "Urgentă" : "Curentă"}
        </div>
        ${seria || nr ? `<div style="margin-top:4px;font-size:9px;">Seria <strong>${seria}</strong> Nr. <strong>${nr}</strong></div>` : ""}
      </td>
    </tr>
  </table>

  <!-- 2. Date identificare asigurat -->
  <table style="margin-bottom:6px;">
    <tr>
      <td colspan="2" class="section-title">2. Date identificare asigurat</td>
    </tr>
    <tr>
      <td style="width:60%">
        ${dotLine("Nume:", patientNume)}
        ${dotLine("Prenume:", patientPrenume)}
        ${dotLine("CNP / Cod identificare:", patientCnp)}
        ${patientAge ? dotLine("Vârstă:", patientAge) : ""}
        ${patientPhone ? dotLine("Telefon:", patientPhone) : ""}
        ${codCardAsigurat ? dotLine("Cod card asigurat:", codCardAsigurat) : ""}
      </td>
      <td style="width:40%;font-size:10px;vertical-align:top;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
          ${[
            ["salariat","Salariat"],["veteran","Veteran"],
            ["coasigurat","Coasigurat"],["revolutionar","Revoluționar"],
            ["liberProfesionist","Liber-profesionist"],["handicap","Handicap"],
            ["copii","Copii (<18 ani)"],["pns","PNS"],
            ["elevUcenic","Elev/Ucenic/Student"],["ajutorSocial","Ajutor social"],
            ["gravidaLauza","Gravidă/Lăuză"],["somaj","Șomaj"],
            ["pensionar","Pensionar"],["cardEuropean","Card European"],
            ["alteCategoii","Alte categorii"],["acorduriInt","Acorduri int."],
          ].map(([k,l]) => `<div>${checkbox(categoriiSelectate.includes(k))} ${l}</div>`).join("")}
        </div>
      </td>
    </tr>
  </table>

  <!-- 3. Cod diagnostic -->
  <table style="margin-bottom:6px;">
    <tr>
      <td class="section-title" colspan="3">3. Cod diagnostic</td>
    </tr>
    <tr>
      <td style="width:30%">
        <div style="font-size:10px;margin-bottom:2px;">Cod diagnostic:</div>
        <div style="border:1px solid #aaa;padding:3px;min-height:20px;font-weight:bold;">${codDiagnostic}</div>
      </td>
      <td style="width:50%">
        ${dotLine("Diagnostic:", diagnostic)}
        ${reason ? dotLine("Motiv trimitere:", reason) : ""}
      </td>
      <td style="width:20%;text-align:center;vertical-align:middle;">
        <div style="font-size:9px;">P &nbsp;&nbsp; A/S &nbsp;&nbsp; C</div>
        <div style="font-size:9px;">☐ &nbsp;&nbsp; ☐ &nbsp;&nbsp; ☐</div>
      </td>
    </tr>
    <tr>
      <td colspan="3" style="font-size:10px;">
        <span>Data trimiterii: <strong>${issuedDate}</strong></span>
        <span style="margin-left:32px;">Semnătura medicului: <span class="dotline" style="width:120px;">&nbsp;</span></span>
        <span style="margin-left:16px;">Cod parafă: <strong>${doctorCod}</strong></span>
      </td>
    </tr>
  </table>

  <!-- 4. Tip investigație indicat -->
  <table style="margin-bottom:6px;">
    <tr>
      <td class="section-title" colspan="3">4.1. Tip investigație / consultație indicată</td>
    </tr>
    <tr>
      <th style="width:8%">Poziție</th>
      <th style="width:25%">Specialitate</th>
      <th>Investigații / consultații recomandate</th>
    </tr>
    <tr>
      <td style="text-align:center">1</td>
      <td><strong>${specialty}</strong></td>
      <td>${clinicalSummary || reason || ""}</td>
    </tr>
    ${destinationUnit ? `<tr><td colspan="3" style="font-size:10px;">Unitate destinație: <strong>${destinationUnit}</strong></td></tr>` : ""}
  </table>

  <!-- 4.2 Date clinice -->
  ${(consult.chiefComplaint || consult.objectiveFindings || consult.recommendations) ? `
  <table style="margin-bottom:6px;">
    <tr>
      <td class="section-title">4.2. Date clinice și paraclinice care justifică investigația</td>
    </tr>
    <tr>
      <td style="min-height:40px;">
        ${consult.chiefComplaint ? `<div><strong>Motiv prezentare:</strong> ${esc(consult.chiefComplaint)}</div>` : ""}
        ${consult.objectiveFindings ? `<div><strong>Constatări obiective:</strong> ${esc(consult.objectiveFindings)}</div>` : ""}
        ${consult.recommendations ? `<div><strong>Recomandări:</strong> ${esc(consult.recommendations)}</div>` : ""}
        ${notes ? `<div><strong>Note:</strong> ${notes}</div>` : ""}
      </td>
    </tr>
  </table>` : ""}

  <!-- 5. Semnătură doctor -->
  <table>
    <tr>
      <td style="width:75%;border:none;">
        <div style="font-size:10px;color:#555;margin-bottom:3px;">5. Numele, semnătura și parafa medicului trimițător:</div>
        ${signatureImgHtml}
        <div style="font-weight:bold;font-size:11px;">${doctorNume}</div>
        ${doctorCod ? `<div style="font-size:10px;color:#555;">${doctorCod}</div>` : ""}
        ${doctorSpecializare ? `<div style="font-size:10px;color:#555;">${doctorSpecializare}</div>` : ""}
      </td>
      <td style="width:25%;border:none;vertical-align:top;">
        <div style="font-size:10px;color:#555;margin-bottom:3px;">6. Data prezentării asiguratului:</div>
        <div style="border-bottom:1px solid #555;width:120px;margin-top:24px;">&nbsp;</div>
        <div style="font-size:9px;color:#555;margin-top:2px;">Semnătura asiguratului</div>
      </td>
    </tr>
  </table>

</body>
</html>`;
}