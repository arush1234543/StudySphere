import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", authMiddleware.checkEmailBody, authMiddleware.checkPasswordBody, authMiddleware.checkUsernameBody, authController.Register);
authRouter.post("/verify-email", authMiddleware.checkEmailBody, authMiddleware.checkOTPBody, authController.verifyEmail);
authRouter.post("/resend-otp", authMiddleware.checkEmailBody, authController.resendOTP);
authRouter.post("/login", authMiddleware.checkEmailBody, authMiddleware.checkPasswordBody, authController.Login);
authRouter.get("/refresh-token", authMiddleware.checkRefreshToken, authController.refreshToken);
authRouter.post("/get-me", authMiddleware.checkAccessToken, authController.getMe);
authRouter.post("/logout", authController.logout);
authRouter.post("/logout-all-devices", authMiddleware.checkAccessToken, authController.logoutAllDevices);
authRouter.post("/forgot-password", authMiddleware.checkEmailBody, authController.forgotPassword);
authRouter.post("/reset-password", authMiddleware.checkEmailBody, authMiddleware.checkOTPBody, authMiddleware.checkPasswordBody, authController.resetPassword);

export default authRouter;
