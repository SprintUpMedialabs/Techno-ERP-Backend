import express from "express";
import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { createSemester, updateSemester, deleteSemester } from "../controllers/semesterController";
import { subjectRoute } from "./subjectRoute";

export const semesterRoute = express.Router();
semesterRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createSemester
)

semesterRoute.put('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    updateSemester
)

semesterRoute.delete('/:id',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    deleteSemester
)

semesterRoute.use('/subject', subjectRoute);