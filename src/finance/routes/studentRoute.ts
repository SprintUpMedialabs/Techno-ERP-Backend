import express from 'express';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';
import { getStudentDetails } from '../studentController';

export const studentRoute = express.Router();

studentRoute.post('/get-student-details', authenticate, authorize([UserRoles.BASIC_USER]), getStudentDetails);

