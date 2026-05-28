import {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  completeAppointment,
} from "../services/appointment.service.js";

export const createAppointmentController = async (req, res, next) => {
  try {
    const result = await createAppointment({
      requesterId: req.user.sub || req.user.id,
      requesterRole: req.user.role,
      ...req.body,
    });

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const getMyAppointmentsController = async (req, res, next) => {
  try {
    const result = await getMyAppointments({
      requesterId: req.user.sub || req.user.id,
      requesterRole: req.user.role,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const cancelAppointmentController = async (req, res, next) => {
  try {
    const result = await cancelAppointment({
      appointmentId: req.params.id,
      requesterId: req.user.sub || req.user.id,
      requesterRole: req.user.role,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const completeAppointmentController = async (req, res, next) => {
  try {
    const updated = await completeAppointment(req.params.id, req.user);
    res.json(updated);
  } catch (err) { next(err); }
};