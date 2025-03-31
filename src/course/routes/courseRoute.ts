import express from 'express';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';
import { semesterRoute } from './semesterRoute';
import { createCourse, deleteCourse, searchCourse  } from '../controllers/courseController';
export const courseRoute = express.Router()

courseRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createCourse
);

courseRoute.delete('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    deleteCourse
);


courseRoute.post('/search',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    searchCourse
)


courseRoute.use('/semester', semesterRoute);
