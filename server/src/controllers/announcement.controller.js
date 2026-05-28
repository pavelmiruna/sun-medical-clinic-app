import {
  createAnnouncement,
  getDashboardAnnouncements,
  getAllAnnouncements,
  updateAnnouncement,
  deactivateAnnouncement,
} from "../services/announcement.service.js";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "../validators/announcement.validator.js";

export async function createAnnouncementController(req, res, next) {
  try {
    const parsed = createAnnouncementSchema.parse(req.body);
    const announcement = await createAnnouncement(parsed, req.user);
    return res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
}

export async function getDashboardAnnouncementsController(req, res, next) {
  try {
    const announcements = await getDashboardAnnouncements(req.user);
    return res.status(200).json(announcements);
  } catch (error) {
    next(error);
  }
}

export async function getAllAnnouncementsController(req, res, next) {
  try {
    const announcements = await getAllAnnouncements(req.user);
    return res.status(200).json(announcements);
  } catch (error) {
    next(error);
  }
}

export async function updateAnnouncementController(req, res, next) {
  try {
    const parsed = updateAnnouncementSchema.parse(req.body);
    const updated = await updateAnnouncement(req.params.id, parsed, req.user);
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deactivateAnnouncementController(req, res, next) {
  try {
    const updated = await deactivateAnnouncement(req.params.id, req.user);
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}