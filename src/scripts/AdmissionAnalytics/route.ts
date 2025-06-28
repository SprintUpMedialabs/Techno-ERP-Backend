import { Router } from "express";

import { redefineAdmissionAnalytics } from "./controller";
export const redefineAdmissionAnalyticsRouter = Router();


redefineAdmissionAnalyticsRouter.get("/", redefineAdmissionAnalytics);
