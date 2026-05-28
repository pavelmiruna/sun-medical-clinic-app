import {
  generateDocumentFromPrescription,
  generateDocumentFromReferral,
  getMedicalDocumentById,
  updateMedicalDocumentDraft,
  finalizeMedicalDocument,
  getMedicalDocumentPdf,
} from "../services/medical-document.service.js";
import { updateMedicalDocumentDraftSchema } from "../validators/medical-document.validator.js";


export async function generateFromPrescriptionController(req, res, next) {
  try {
    const { prescriptionId } = req.params;

    const document = await generateDocumentFromPrescription(
      prescriptionId,
      req.user
    );

    return res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

export async function getMedicalDocumentByIdController(req, res, next) {
  try {
    const { id } = req.params;

    const document = await getMedicalDocumentById(id, req.user);

    return res.status(200).json(document);
  } catch (error) {
    next(error);
  }
}

export async function updateMedicalDocumentDraftController(req, res, next) {
  try {
    const parsed = updateMedicalDocumentDraftSchema.parse(req.body);

    const updated = await updateMedicalDocumentDraft(
      req.params.id,
      parsed.overrides,
      req.user
    );

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function finalizeMedicalDocumentController(req, res, next) {
  try {
    const updated = await finalizeMedicalDocument(req.params.id, req.user);
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function generateFromReferralController(req, res, next) {
  try {
    const { referralId } = req.params;

    const document = await generateDocumentFromReferral(referralId, req.user);

    return res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

export async function getMedicalDocumentPdfController(req, res, next) {
  try {
    const pdfUrl = await getMedicalDocumentPdf(req.params.id, req.user);
    return res.redirect(pdfUrl);
  } catch (error) {
    next(error);
  }
}