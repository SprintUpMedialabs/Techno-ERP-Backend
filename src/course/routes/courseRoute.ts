import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import express from 'express';
import { createCourse, fetchAllUniqueCourses, searchCourses, updateCourse } from "../controllers/courseController";
import { subjectRoute } from "./subjectRoute";

export const courseRoute = express.Router()

courseRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createCourse
);

courseRoute.put('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    updateCourse
);

courseRoute.post('/course-details',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    searchCourses
);

courseRoute.get('/unique-courses',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    fetchAllUniqueCourses
)

courseRoute.use('/subject', subjectRoute);