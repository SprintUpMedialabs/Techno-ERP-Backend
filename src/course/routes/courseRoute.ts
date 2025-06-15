import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import express from 'express';
import { createCourse, fetchAllUniqueCourses, fetchCourseId, searchCourses, updateCourse } from "../controllers/courseController";
import { subjectRoute } from "./subjectRoute";
import { courseFeeDues, getCourseDuesByDate } from "../controllers/courseFinanceController";

export const courseRoute = express.Router()

courseRoute.post('/',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
    createCourse
);

courseRoute.put('/',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
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

courseRoute.post('/course-id',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    fetchCourseId
)



courseRoute.post('/dues',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
    courseFeeDues
);

courseRoute.post('/fetch-dues',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getCourseDuesByDate
);

courseRoute.use('/subject', subjectRoute);