import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import express from 'express';
import { createSubject, deleteSubject, fetchSubjectInformationUsingFilters, getSubjectInformation, updateSubject } from "../controllers/subjectController";
import { scheduleRoute } from "./scheduleRoute";

export const subjectRoute = express.Router()

subjectRoute.post('/',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
    createSubject
);

subjectRoute.put('/',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
    updateSubject
);

subjectRoute.delete('/',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
    deleteSubject
);

subjectRoute.post('/subject-details',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getSubjectInformation
);

subjectRoute.post('/filtered-subject-details',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    fetchSubjectInformationUsingFilters
);

subjectRoute.use('/schedule', scheduleRoute);