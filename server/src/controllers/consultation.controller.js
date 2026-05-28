import {
  createConsultationSchema,
  updateConsultationSchema,
} from "../validators/consultation.validator.js";

import {
  createConsultation,
  createWalkInConsultation,
  getConsultationById,
  updateConsultation,
  getMyDoctorConsultations,
  getPatientConsultations,
} from "../services/consultation.service.js";

function getZodError(error) {
  return error.issues?.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

export async function createConsultationController(req, res, next) {
  try {
    const parsed = createConsultationSchema.parse(req.body);

    const consultation = await createConsultation({
        appointment: req.appointment,
        chiefComplaint: parsed.chiefComplaint,
        diagnosis: parsed.diagnosis,
        treatment: parsed.treatment,
        objectiveFindings: parsed.objectiveFindings,
        notes: parsed.notes,
        recommendations: parsed.recommendations,
        plan: parsed.plan,
    });

    return res.status(201).json(consultation);
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

export async function getConsultationByIdController(req, res, next) {
  try {
    const consultation = await getConsultationById(req.params.id, req.user);
    return res.json(consultation);
  } catch (error) {
    next(error);
  }
}

export async function updateConsultationController(req, res, next) {
  try {
    const parsed = updateConsultationSchema.parse(req.body);

    const consultation = await updateConsultation(req.params.id, parsed);

    return res.json(consultation);
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

export async function getMyDoctorConsultationsController(req, res, next) {
  try {
    const consultations = await getMyDoctorConsultations(req.user);
    return res.json(consultations);
  } catch (error) {
    next(error);
  }
}

export async function getPatientConsultationsController(req, res, next) {
  try {
    const consultations = await getPatientConsultations(req.params.patientId, req.user);
    return res.json(consultations);
  } catch (error) {
    next(error);
  }
}

export async function createWalkInConsultationController(req, res, next) {
  try {
    const parsed = updateConsultationSchema.parse(req.body);
    const callerId = req.user.sub || req.user.id;
    const callerRole = req.user.role;
    const { patientId, doctorId: bodyDoctorId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "patientId este obligatoriu" });
    }

    let doctorId;
    if (callerRole === "ASSISTANT") {
      if (!bodyDoctorId) {
        return res.status(400).json({ message: "doctorId este obligatoriu pentru asistent" });
      }
      doctorId = bodyDoctorId;
    } else {
      doctorId = callerId;
    }

    const consultation = await createWalkInConsultation({
      doctorId,
      patientId,
      ...parsed,
    });

    return res.status(201).json(consultation);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Date invalide", errors: getZodError(error) });
    }
    next(error);
  }
}