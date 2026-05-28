const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMedicationRows(medications = []) {
  return medications.map((item, index) => `
    <tr>
      <td style="text-align:center">${index + 1}</td>
      <td><strong>${escapeHtml(item.medicationName)}</strong></td>
      <td style="text-align:center">${escapeHtml(item.concentration)}</td>
      <td style="text-align:center">${escapeHtml(item.form)}</td>
      <td style="text-align:center">${escapeHtml(item.frequency)}</td>
      <td style="text-align:center">${escapeHtml(item.quantity)}</td>
      <td style="text-align:center">${escapeHtml(item.duration)}</td>
    </tr>
  `).join("");
}

export function renderPrescriptionHtml(document) {
  const content     = document.finalContent ?? {};
  const header      = content.header          ?? {};
  const patient     = content.patientSection  ?? {};
  const doctor      = content.doctorSection   ?? {};
  const clinical    = content.clinicalSection ?? {};
  const footer      = content.footer          ?? {};
  const medications = content.medications     ?? [];
  const overrides   = document.overrides      ?? {};

  const unitateSanitara = escapeHtml(overrides.unitateSanitara || header.unitateSanitara || "");
  const adresaCabinet   = escapeHtml(overrides.adresaCabinet   || header.adresaCabinet   || "");
  const seria = escapeHtml(overrides.seria || header.seria || header.serialPrefix || "—");
  const nr    = escapeHtml(overrides.nr    || header.nr    || "—");

  const doctorNume         = escapeHtml(overrides.doctorNume         || doctor.fullName       || "");
  const doctorCod          = escapeHtml(overrides.doctorCod          || doctor.parafaCode     || "");
  const doctorSpecializare = escapeHtml(overrides.doctorSpecializare || doctor.specialization || "");
  const includeSignature = overrides.includeSignature !== false;
  const signatureUrl = includeSignature
    ? (overrides.signatureUrl || doctor.signatureUrl || null)
    : null;

  const patientName = escapeHtml(patient.fullName || "");
  const patientAge  = escapeHtml(patient.age      || "");
  const patientCnp  = escapeHtml(overrides.patientCnp || patient.cnp || "");
  const diagnostic  = escapeHtml(overrides.diagnostic || clinical.prescriptionDiagnosis || clinical.diagnosis || "");

  let issuedDate;
  if (!header.issuedAt) {
    issuedDate = new Date().toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  } else {
    const parsed = new Date(header.issuedAt);
    issuedDate = isNaN(parsed.getTime())
      ? String(header.issuedAt) // deja formatat
      : parsed.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  const generalInstructions = escapeHtml(footer.extraMentions || "");

  const signatureImgHtml = signatureUrl
    ? `<img src="${BASE_URL}${signatureUrl}" style="max-height:80px;max-width:200px;display:block;margin-bottom:4px;" alt="Semnătură și parafă" />`
    : `<div style="border-top:1px solid #333;width:180px;margin-bottom:4px;margin-top:40px;"></div>`;

  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8"/>
  <title>Prescripție medicală</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;background:white;padding:24px 32px}
    .header-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #cc0000}
    .cabinet-name{font-size:13px;font-weight:bold;margin-bottom:2px}
    .cabinet-address{font-size:10px;color:#555}
    .seria-box{text-align:right;font-size:11px}
    .seria-box strong{font-size:13px}
    .doc-title{text-align:center;font-size:20px;font-weight:bold;letter-spacing:2px;margin:20px 0 16px;text-transform:uppercase}
    .patient-table{width:100%;border-collapse:collapse;margin-bottom:20px}
    .patient-table td{border:1px solid #bbb;padding:6px 10px;vertical-align:top}
    .patient-table .label-col{font-weight:bold;width:130px;background:#f7f7f7;white-space:nowrap}
    .section-title{font-size:14px;font-weight:bold;margin:16px 0 8px;text-transform:uppercase}
    .med-table{width:100%;border-collapse:collapse;margin-bottom:16px}
    .med-table th{background:#f0f0f0;border:1px solid #bbb;padding:6px 8px;font-size:10px;font-weight:bold;text-align:center;vertical-align:middle}
    .med-table td{border:1px solid #bbb;padding:7px 8px;font-size:11px;vertical-align:middle}
    .med-table tr:nth-child(even) td{background:#fafafa}
    .instructions-box{border:1px solid #bbb;padding:8px 12px;border-radius:4px;background:#fafafa;font-size:11px;min-height:32px;margin-bottom:20px;white-space:pre-wrap}
    .footer-sign{display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px;padding-top:12px;border-top:1px solid #ddd}
    .footer-doctor{text-align:right;font-size:11px}
    .doctor-name{font-weight:bold;font-size:13px;margin-bottom:2px}
  </style>
</head>
<body>
  <div class="header-top">
    <div>
      <div style="font-size:10px;font-weight:bold;text-transform:uppercase;color:#cc0000;margin-bottom:4px;">Unitate sanitară</div>
      <div class="cabinet-name">${unitateSanitara || "—"}</div>
      ${adresaCabinet ? `<div class="cabinet-address">${adresaCabinet}</div>` : ""}
    </div>
    <div class="seria-box">
      <span>Seria </span><strong>${seria}</strong>
      <span style="margin-left:12px;">Nr. </span><strong>${nr}</strong>
    </div>
  </div>

  <div class="doc-title">Prescripție medicală</div>

  <table class="patient-table">
    <tr>
      <td class="label-col">Date pacient:</td>
      <td>
        <div>Numele și prenumele: &nbsp;<strong>${patientName}</strong></div>
        ${patientAge ? `<div style="margin-top:4px;">Vârsta: &nbsp;<strong>${patientAge}</strong></div>` : ""}
        ${patientCnp ? `<div style="margin-top:4px;">CNP / Cod identificare: &nbsp;<strong>${patientCnp}</strong></div>` : ""}
        ${diagnostic ? `<div style="margin-top:4px;">Diagnostic: &nbsp;<strong>${diagnostic}</strong></div>` : ""}
      </td>
    </tr>
  </table>

  <div class="section-title">Tratament</div>
  <table class="med-table">
    <thead>
      <tr>
        <th style="width:40px">Nr.<br/>crt.</th>
        <th>Denumire comercială și/sau<br/>denumirea comună internațională</th>
        <th style="width:90px">Concentrație</th>
        <th style="width:90px">Forma<br/>farmaceutică</th>
        <th style="width:100px">Mod<br/>administrare</th>
        <th style="width:110px">Cantitate<br/>(exprimată în<br/>unități terapeutice)</th>
        <th style="width:80px">Durată<br/>tratament</th>
      </tr>
    </thead>
    <tbody>
      ${medications.length > 0
        ? renderMedicationRows(medications)
        : `<tr><td colspan="7" style="text-align:center;color:#aaa;padding:16px;">Niciun medicament</td></tr>`
      }
    </tbody>
  </table>

  ${generalInstructions ? `
  <div style="margin-bottom:16px;">
    <div style="font-weight:bold;margin-bottom:4px;font-size:11px;">Instrucțiuni generale:</div>
    <div class="instructions-box">${generalInstructions}</div>
  </div>` : ""}

  <div class="footer-sign">
    <div style="font-size:11px;">Data: <strong>${issuedDate}</strong></div>
    <div class="footer-doctor">
      <div style="font-size:10px;color:#555;margin-bottom:6px;">Semnătura și parafa medicului:</div>
      ${signatureImgHtml}
      <div class="doctor-name">${doctorNume}</div>
      ${doctorCod ? `<div style="color:#555;">${doctorCod}</div>` : ""}
      ${doctorSpecializare ? `<div style="font-size:10px;color:#555;">${doctorSpecializare}</div>` : ""}
    </div>
  </div>
</body>
</html>`;
}