import {
  createDoctorScheduleSchema,
  updateDoctorScheduleSchema,
  availableSlotsQuerySchema,
} from "../validators/doctorSchedule.validator.js";
import {
  createDoctorSchedule,
  getMyDoctorSchedules,
  updateDoctorSchedule,
  deleteDoctorSchedule,
  getDoctorAvailableSlots,
} from "../services/doctorSchedule.service.js";

function getZodError(error) {
  return error.issues?.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

export async function createDoctorScheduleController(req, res, next) {
  try {
    const parsed = createDoctorScheduleSchema.parse(req.body);

    const schedule = await createDoctorSchedule({
      doctorId: req.user.sub || req.user.id,
      ...parsed,
    });

    return res.status(201).json(schedule);
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

export async function getMyDoctorSchedulesController(req, res, next) {
  try {
    const schedules = await getMyDoctorSchedules(req.user.sub || req.user.id);
    return res.json(schedules);
  } catch (error) {
    next(error);
  }
}

export async function updateDoctorScheduleController(req, res, next) {
  try {
    const parsed = updateDoctorScheduleSchema.parse(req.body);

    const schedule = await updateDoctorSchedule(
      req.params.id,
      req.user.sub || req.user.id,
      parsed
    );

    return res.json(schedule);
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

export async function deleteDoctorScheduleController(req, res, next) {
  try {
    const result = await deleteDoctorSchedule(
      req.params.id,
      req.user.sub || req.user.id
    );

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDoctorAvailableSlotsController(req, res, next) {
  try {
    const parsed = availableSlotsQuerySchema.parse(req.query);

    const slots = await getDoctorAvailableSlots(req.params.id, parsed.date);

    return res.json(slots);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Query invalid",
        errors: getZodError(error),
      });
    }
    next(error);
  }
}