import { Router } from "express";
import { register, signIn } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", signIn);

export default router;