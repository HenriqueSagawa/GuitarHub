import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { registerTeacherSchema, loginSchema, refreshTokenSchema } from "./auth.schema";

const router = Router();


// POST /auth/register  → cadastrar professor
router.post("/register", validate({body: registerTeacherSchema}), authController.registerTeacher);


// POST /auth/register  → cadastrar professor
router.post("/login", validate({body: loginSchema}), authController.login);

// POST /auth/refresh
router.post("/refresh", validate({body: refreshTokenSchema}), authController.refresh);

// POST /auth/logout  (autenticado)
router.post("/logout", authenticate, authController.logout);

// POST /auth/logout  (autenticado)
router.get("/me", authenticate, authController.getMe);

export default router;