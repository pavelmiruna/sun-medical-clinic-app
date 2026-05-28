import { PrismaClient } from "@prisma/client";
import { buildPrescriptionDocumentSnapshot } from "../utils/medical-document/buildPrescriptionDocumentSnapshot.js";
import { buildPrescriptionGeneratedContent } from "../utils/medical-document/buildPrescriptionGeneratedContent.js";
import { mergeDocumentContent } from "../utils/medical-document/mergeDocumentContent.js";
import { buildReferralDocumentSnapshot } from "../utils/medical-document/buildReferralDocumentSnapshot.js";
import { buildReferralGeneratedContent } from "../utils/medical-document/buildReferralGeneratedContent.js";
import {
  MEDICAL_DOCUMENT_STATUS,
  MEDICAL_DOCUMENT_TYPE,
} from "../constants/medical-document.constant.js";
import path from "path";
import { fileURLToPath } from "url";
import { generatePdfFromHtml } from "../utils/medical-document/generatePdfFromHtml.js";
import { renderMedicalDocumentHtml } from "../utils/medical-document/renderMedicalDocumentHtml.js";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildDocumentTitle(patientFullName) {
  if (!patientFullName) return "Prescripție medicală";
  return `Prescripție medicală - ${patientFullName}`;
}

function assertDocumentEditor(user) {
  if (!user || !["DOCTOR", "ASSISTANT", "PATIENT"].includes(user.role)) {
    const error = new Error("Nu ai permisiunea de a accesa acest document.");
    error.statusCode = 403;
    throw error;
  }
}


export async function generateDocumentFromPrescription(prescriptionId, currentUser) {
  assertDocumentEditor(currentUser);

  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      consultation: {
        include: { appointment: { select: { scheduledAt: true } } },
      },
      patient: { include: { accesses: true } },
      doctor: {
        include: {
          doctorProfile: {
            include: { clinic: true },
          },
        },
      },
      items: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!prescription) {
    const error = new Error("Rețeta nu a fost găsită.");
    error.statusCode = 404;
    throw error;
  }

  const isDoctor = currentUser.role === "DOCTOR" && prescription.doctorId === currentUser.id;
  const isAssistant = currentUser.role === "ASSISTANT";
  const isPatientOwner = currentUser.role === "PATIENT" && prescription.patient?.userId === currentUser.id;
  const hasPatientAccess = currentUser.role === "PATIENT" && prescription.patient?.accesses?.some(
    (access) => access.userId === currentUser.id
  );

  if (!isDoctor && !isAssistant && !isPatientOwner && !hasPatientAccess) {
    const error = new Error("Nu ai permisiunea de a accesa acest document.");
    error.statusCode = 403;
    throw error;
  }

  const existingDraft = await prisma.medicalDocument.findFirst({
    where: {
      prescriptionId: prescription.id,
      type: MEDICAL_DOCUMENT_TYPE.PRESCRIPTION,
      status: MEDICAL_DOCUMENT_STATUS.DRAFT,
    },
  });

  if (existingDraft) {
    return existingDraft;
  }

  const sourceSnapshot = buildPrescriptionDocumentSnapshot(prescription);
  const generatedContent = buildPrescriptionGeneratedContent(sourceSnapshot);
  const overrides = {};
  const finalContent = mergeDocumentContent(generatedContent, overrides);

  const document = await prisma.medicalDocument.create({
    data: {
      type: MEDICAL_DOCUMENT_TYPE.PRESCRIPTION,
      status: MEDICAL_DOCUMENT_STATUS.DRAFT,

      consultationId: prescription.consultationId ?? null,
      prescriptionId: prescription.id,

      doctorId: prescription.doctorId,
      patientId: prescription.patientId,
      createdByUserId: currentUser.id,

      title: buildDocumentTitle(sourceSnapshot.patient?.fullName),
      templateKey: "prescription_v1",
      version: 1,

      sourceSnapshot,
      generatedContent,
      overrides,
      finalContent,
    },
  });

  return document;
}

export async function getMedicalDocumentById(documentId, currentUser) {
  const document = await prisma.medicalDocument.findUnique({
    where: { id: documentId },
    include: {
      patient: {
        include: {
          accesses: true,
          user: true,
        },
      },
      doctor: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      consultation: true,
      prescription: {
        include: {
          items: {
            orderBy: {
              orderIndex: "asc",
            },
          },
        },
      },
    },
  });

  if (!document) {
    const error = new Error("Documentul medical nu a fost găsit.");
    error.statusCode = 404;
    throw error;
  }

  const userId = currentUser.sub || currentUser.id;
  const role = currentUser.role;

  const isDoctorOwner = document.doctorId === userId;
  const isStaff = role === "DOCTOR" || role === "ASSISTANT" || role === "ADMIN";

  const isPatientOwner = document.patient?.userId === userId;
  const hasPatientAccess = document.patient?.accesses?.some(
    (access) => access.userId === userId
  );

  const canPatientSeeDocument =
    document.status === MEDICAL_DOCUMENT_STATUS.FINALIZED &&
    (isPatientOwner || hasPatientAccess);

  if (!isDoctorOwner && !isStaff && !canPatientSeeDocument) {
    const error = new Error("Nu ai permisiunea de a accesa acest document.");
    error.statusCode = 403;
    throw error;
  }

  return document;
}

export async function updateMedicalDocumentDraft(documentId, overrides, currentUser) {
  assertDocumentEditor(currentUser);

  const document = await prisma.medicalDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    const error = new Error("Documentul medical nu a fost găsit.");
    error.statusCode = 404;
    throw error;
  }

  const canEdit =
    (currentUser.role === "DOCTOR" && document.doctorId === currentUser.id) ||
    currentUser.role === "ASSISTANT";

  if (!canEdit) {
    const error = new Error("Nu ai permisiunea de a accesa acest document.");
    error.statusCode = 403;
    throw error;
  }

  if (document.status !== MEDICAL_DOCUMENT_STATUS.DRAFT) {
    const error = new Error("Documentul nu mai poate fi editat (nu mai este în stadiu draft).");
    error.statusCode = 400;
    throw error;
  }

  const finalContent = mergeDocumentContent(
    document.generatedContent ?? {},
    overrides ?? {}
  );

  const updated = await prisma.medicalDocument.update({
    where: { id: documentId },
    data: {
      overrides: overrides ?? {},
      finalContent,
    },
  });

  return updated;
}

export async function finalizeMedicalDocument(documentId, currentUser) {
  assertDocumentEditor(currentUser);

  const document = await prisma.medicalDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    const error = new Error("Documentul medical nu a fost găsit.");
    error.statusCode = 404;
    throw error;
  }

  const canFinalize =
    (currentUser.role === "DOCTOR" && document.doctorId === currentUser.id) ||
    currentUser.role === "ASSISTANT" ||
    currentUser.role === "PATIENT";

  if (!canFinalize) {
    const error = new Error("Nu ai permisiunea de a accesa acest document.");
    error.statusCode = 403;
    throw error;
  }

  if (document.status !== MEDICAL_DOCUMENT_STATUS.DRAFT) {
    const error = new Error("Documentul nu mai poate fi finalizat (nu mai este în stadiu draft).");
    error.statusCode = 400;
    throw error;
  }

  const finalContent = mergeDocumentContent(
    document.generatedContent ?? {},
    document.overrides ?? {}
  );

  const now = new Date();

  const finalizedDocument = await prisma.medicalDocument.update({
    where: { id: documentId },
    data: {
      finalContent,
      status: MEDICAL_DOCUMENT_STATUS.FINALIZED,
      finalizedAt: now,
      issuedAt: now,
    },
  });

  const html = renderMedicalDocumentHtml(finalizedDocument);

  const outputDir = path.resolve(__dirname, "../../uploads/documents");
  const outputPath = path.join(outputDir, `${finalizedDocument.id}.pdf`);
  const pdfUrl = `/uploads/documents/${finalizedDocument.id}.pdf`;

  await generatePdfFromHtml(html, outputPath);

  const updatedWithPdf = await prisma.medicalDocument.update({
    where: { id: documentId },
    data: {
      pdfUrl,
      pdfGeneratedAt: new Date(),
    },
  });

  return updatedWithPdf;
}

export async function generateDocumentFromReferral(referralId, currentUser) {
  assertDocumentEditor(currentUser);

  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: {
      consultation: {
        include: { appointment: { select: { scheduledAt: true } } },
      },
      patient: {
        include: { accesses: true, user: true },
      },
      doctor: {
        include: {
          doctorProfile: { include: { clinic: true } },
        },
      },
    },
  });

  if (!referral) {
    const error = new Error("Trimiterea nu a fost găsită.");
    error.statusCode = 404;
    throw error;
  }

  const isReferralPatientOwner = currentUser.role === "PATIENT" && referral.patient?.userId === currentUser.id;
  const hasReferralPatientAccess = currentUser.role === "PATIENT" && referral.patient?.accesses?.some(
    (access) => access.userId === currentUser.id
  );

  const canGenerate =
    (currentUser.role === "DOCTOR" && referral.doctorId === currentUser.id) ||
    currentUser.role === "ASSISTANT" ||
    isReferralPatientOwner ||
    hasReferralPatientAccess;

  if (!canGenerate) {
    const error = new Error("Nu ai permisiunea de a accesa acest document.");
    error.statusCode = 403;
    throw error;
  }

  const existingDraft = await prisma.medicalDocument.findFirst({
    where: {
      referralId: referral.id,
      type: MEDICAL_DOCUMENT_TYPE.REFERRAL,
      status: MEDICAL_DOCUMENT_STATUS.DRAFT,
    },
  });

  if (existingDraft) {
    return existingDraft;
  }

  const sourceSnapshot = buildReferralDocumentSnapshot(referral);
  const generatedContent = buildReferralGeneratedContent(sourceSnapshot);
  const overrides = {};
  const finalContent = mergeDocumentContent(generatedContent, overrides);

  const document = await prisma.medicalDocument.create({
    data: {
      type: MEDICAL_DOCUMENT_TYPE.REFERRAL,
      status: MEDICAL_DOCUMENT_STATUS.DRAFT,

      consultationId: referral.consultationId ?? null,
      referralId: referral.id,

      doctorId: referral.doctorId,
      patientId: referral.patientId,
      createdByUserId: currentUser.id,

      title: `Bilet de trimitere - ${sourceSnapshot.patient?.fullName ?? "Pacient"}`,
      templateKey: "referral_v1",
      version: 1,

      sourceSnapshot,
      generatedContent,
      overrides,
      finalContent,
    },
  });

  return document;
}

export async function getMedicalDocumentPdf(documentId, currentUser) {
  const document = await getMedicalDocumentById(documentId, currentUser);

  if (!document.pdfUrl) {
    const error = new Error("PDF-ul nu a fost generat pentru acest document.");
    error.statusCode = 404;
    throw error;
  }

  return document.pdfUrl;
}