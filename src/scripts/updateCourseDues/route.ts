import { Router } from "express";
import { updateCourseDues } from "./controller";

export const courseDuesRoute = Router();

courseDuesRoute.get("/", updateCourseDues);