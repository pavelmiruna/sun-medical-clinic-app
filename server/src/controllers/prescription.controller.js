import {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  createPrescriptionItemSchema,
  updatePrescriptionItemSchema,
} from "../validators/prescription.validator.js";

import {
  createPrescription,
  getPrescriptionById,
  updatePrescription,
  getMyDoctorPrescriptions,
  getPatientPrescriptions,
  addPrescriptionItem,
  updatePrescriptionItem,
  deletePrescriptionItem,
} from "../services/prescription.service.js";

function getZodError(error) {
  return error.issues?.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

export async function createPrescriptionController(req, res, next) {
  try {
    const parsed = createPrescriptionSchema.parse(req.body);

    const prescription = await createPrescription({
      ...parsed,
      doctorUserId: req.user.sub || req.user.id,
      callerRole: req.user.role,
    });

    return res.status(201).json(prescription);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Date invalide",
        errors: getZodError(error),
      });
    }
    next(error);
  }
}

export async function getPrescriptionByIdController(req, res, next) {
  try {
    const prescription = await getPrescriptionById(req.params.id, req.user);
    return res.json(prescription);
  } catch (error) {
    next(error);
  }
}

export async function updatePrescriptionController(req, res, next) {
  try {
    const parsed = updatePrescriptionSchema.parse(req.body);

    const prescription = await updatePrescription(
      req.params.id,
      req.user,
      parsed
    );

    return res.json(prescription);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Date invalide",
        errors: getZodError(error),
      });
    }
    next(error);
  }
}

export async function getMyDoctorPrescriptionsController(req, res, next) {
  try {
    const prescriptions = await getMyDoctorPrescriptions(req.user.sub || req.user.id);
    return res.json(prescriptions);
  } catch (error) {
    next(error);
  }
}

export async function getPatientPrescriptionsController(req, res, next) {
  try {
    const prescriptions = await getPatientPrescriptions(req.params.patientId, req.user);
    return res.json(prescriptions);
  } catch (error) {
    next(error);
  }
}

export async function addPrescriptionItemController(req, res, next) {
  try {
    const parsed = createPrescriptionItemSchema.parse(req.body);

    const item = await addPrescriptionItem(
      req.params.id,
      req.user,
      parsed
    );

    return res.status(201).json(item);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Date invalide",
        errors: getZodError(error),
      });
    }
    next(error);
  }
}

export async function updatePrescriptionItemController(req, res, next) {
  try {
    const parsed = updatePrescriptionItemSchema.parse(req.body);

    const item = await updatePrescriptionItem(
      req.params.itemId,
      req.user,
      parsed
    );

    return res.json(item);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Date invalide",
        errors: getZodError(error),
      });
    }
    next(error);
  }
}

export async function deletePrescriptionItemController(req, res, next) {
  try {
    const result = await deletePrescriptionItem(
      req.params.itemId,
      req.user
    );

    return res.json(result);
  } catch (error) {
    next(error);
  }
}