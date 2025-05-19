import { Router } from "express";
import { UserRoles } from "../config/constants";
import { authenticate, authorize } from "../middleware/jwtAuthenticationMiddleware";
import { sendTodayPipelineSummaryEmail } from "./controller";

export const piplineRouter = Router();

piplineRouter.get('/send-summary-email',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
    sendTodayPipelineSummaryEmail
);
