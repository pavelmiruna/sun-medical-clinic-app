import {
  createVaccinationRecord,
  getVaccinationRecordById,
  getPatientVaccinationHistory,
  updateVaccinationRecord,
  deleteVaccinationRecord,
} from "../services/vaccination.service.js";
import {
  createVaccinationRecordSchema,
  updateVaccinationRecordSchema,
} from "../validators/vaccination.validator.js";

export async function createVaccinationRecordController(req, res, next) {
  try {
    const parsed = createVaccinationRecordSchema.parse(req.body);
    const record = await createVaccinationRecord(parsed, req.user);
    return res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

export async function getVaccinationRecordByIdController(req, res, next) {
  try {
    const record = await getVaccinationRecordById(req.params.id, req.user);
    return res.status(200).json(record);
  } catch (error) {
    next(error);
  }
}

export async function getPatientVaccinationHistoryController(req, res, next) {
  try {
    const records = await getPatientVaccinationHistory(req.params.patientId, req.user);
    return res.status(200).json(records);
  } catch (error) {
    next(error);
  }
}

export async function updateVaccinationRecordController(req, res, next) {
  try {
    const parsed = updateVaccinationRecordSchema.parse(req.body);
    const updated = await updateVaccinationRecord(req.params.id, parsed, req.user);
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteVaccinationRecordController(req, res, next) {
  try {
    const result = await deleteVaccinationRecord(req.params.id, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}