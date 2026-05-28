import { renderPrescriptionHtml } from "./renderPrescriptionHtml.js";
import { renderReferralHtml } from "./renderReferralHtml.js";

export function renderMedicalDocumentHtml(document) {
  if (document.type === "PRESCRIPTION") {
    return renderPrescriptionHtml(document);
  }

  if (document.type === "REFERRAL") {
    return renderReferralHtml(document);
  }

  throw new Error(`Unsupported medical document type: ${document.type}`);
}