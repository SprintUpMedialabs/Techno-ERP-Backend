import express from "express";
import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { scheduleRoute } from "./scheduleRoute";
import { createSubject, deleteSubject, updateSubject } from "../controllers/subjectController";


export const subjectRoute = express.Router();
subjectRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createSubject
)

subjectRoute.put('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    updateSubject
)

subjectRoute.delete('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    deleteSubject
)

subjectRoute.use('/schedule', scheduleRoute);