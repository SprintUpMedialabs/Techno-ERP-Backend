import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import express from 'express';
import { createSubject, getSubjectInformation } from "../controllers/subjectController";
import { scheduleRoute } from "./scheduleRoute";

export const subjectRoute = express.Router()

subjectRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createSubject
);


subjectRoute.post('/subject-details',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getSubjectInformation
);


subjectRoute.use('/schedule', scheduleRoute);