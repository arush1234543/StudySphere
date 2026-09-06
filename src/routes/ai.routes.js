import { Router } from "express";
import * as aiController from "../controller/ai.controller.js"
import * as aiMiddleware from "../middleware/ai.middleware.js"
import * as authMiddleware from '../middleware/auth.middleware.js'

const aiRouter = Router()

aiRouter.post("/ai", aiMiddleware.checkPrompt, aiMiddleware.checkIfAppropriate, authMiddleware.chechIfAuthenticated, aiController.AI)
aiRouter.post("/text-to-speech", aiMiddleware.checkPrompt,aiMiddleware.checkIfAppropriate, authMiddleware.chechIfAuthenticated, authMiddleware.checkEmailBody, aiController.TextToSpeech)
aiRouter.get("/getVoices", aiController.getVoices)

export default aiRouter