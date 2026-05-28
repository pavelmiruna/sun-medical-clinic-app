import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  getClinic,
  createClinic,
  updateClinic,
  getMyDoctorProfile,
  upsertMyDoctorProfile,
  uploadSignature,
  uploadParafa,
  getDoctorProfileByUserId,
} from "../controllers/clinic_doctorProfile.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// ─── Multer setup ─────────────────────────────────────────────
function createUpload(folder) {
  const dir = path.resolve(__dirname, `../../uploads/${folder}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user.id}_${Date.now()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error("Doar imagini JPG, PNG, WEBP sunt acceptate"));
    },
  });
}

const uploadSignatureMiddleware = createUpload("signatures");
const uploadParafaMiddleware = createUpload("parafe");

// ─── Clinic routes ─────────────────────────────────────────────
router.get("/clinic", requireAuth, getClinic);
router.post("/clinic", requireAuth, requireRole("ADMIN", "DOCTOR", "ASSISTANT"), createClinic);
router.put("/clinic/:id", requireAuth, requireRole("ADMIN", "DOCTOR", "ASSISTANT"), updateClinic);

// ─── Doctor Profile routes ─────────────────────────────────────
router.get("/doctor-profile/me", requireAuth, requireRole("DOCTOR", "ASSISTANT"), getMyDoctorProfile);
router.put("/doctor-profile/me", requireAuth, requireRole("DOCTOR", "ASSISTANT"), upsertMyDoctorProfile);

router.post(
  "/doctor-profile/me/signature",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  uploadSignatureMiddleware.single("signature"),
  uploadSignature
);

router.post(
  "/doctor-profile/me/parafa",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  uploadParafaMiddleware.single("parafa"),
  uploadParafa
);

router.get("/doctor-profile/:userId", requireAuth, getDoctorProfileByUserId);

export default router;