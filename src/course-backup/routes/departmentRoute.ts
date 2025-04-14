import express from 'express';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';
import { courseRoute } from './courseRoute';
import { createDepartment, updateDepartment } from '../controllers/departmentController';
export const departmentRoute = express.Router()

departmentRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createDepartment
);

departmentRoute.put('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    updateDepartment
);

departmentRoute.use('/course', courseRoute)