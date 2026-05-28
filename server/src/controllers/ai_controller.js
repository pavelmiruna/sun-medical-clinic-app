import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getPatientMedicalSummary,
  patientChatMessage,
  getCabinetInsights,
} from "../services/ai_service.js";

export const patientSummaryController = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const result = await getPatientMedicalSummary(patientId, req.user);

  res.json(result);
});

export const patientChatController = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { message, isFirstMessage } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ message: "Mesajul nu poate fi gol" });
  }

  if (message.trim().length > 500) {
    return res.status(400).json({ message: "Mesajul este prea lung (max 500 caractere)" });
  }

  const result = await patientChatMessage({
    message: message.trim(),
    patientId,
    currentUser: req.user,
    isFirstMessage: isFirstMessage === true,
  });

  res.json(result);
});

export const cabinetInsightsController = asyncHandler(async (req, res) => {
  const result = await getCabinetInsights(req.user);

  res.json(result);
});