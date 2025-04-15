import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import express from 'express';
import { createCourse, searchCourses } from "../controllers/courseController";
import { subjectRoute } from "./subjectRoute";

export const courseRoute = express.Router()

courseRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createCourse
);

courseRoute.post('/course-details',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    searchCourses
);


courseRoute.use('/subject', subjectRoute);