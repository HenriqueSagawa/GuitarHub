import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { registerTeacherSchema, loginSchema, refreshTokenSchema } from "./auth.schema";

const router = Router();

router.post("/register", validate({body: registerTeacherSchema}), authController.registerTeacher);
router.post("/login", validate({body: loginSchema}), authController.login);
router.post("/refresh", validate({body: refreshTokenSchema}), authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);

export default router;