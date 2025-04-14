import express from 'express';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';
import { createSchedule, deleteSchedule, updateSchedule } from '../controllers/scheduleController';

export const scheduleRoute = express.Router()

scheduleRoute.post('/', 
    authenticate, 
    authorize([UserRoles.BASIC_USER]),
    createSchedule 
)


scheduleRoute.put('/', 
    authenticate, 
    authorize([UserRoles.BASIC_USER]),
    updateSchedule 
)


scheduleRoute.delete('/', 
    authenticate, 
    authorize([UserRoles.BASIC_USER]),
    deleteSchedule 
)
