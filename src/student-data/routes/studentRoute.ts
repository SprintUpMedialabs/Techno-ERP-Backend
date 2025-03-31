import express from 'express';
import { UserRoles } from '../../config/constants';
import upload from '../../config/multerConfig';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { getStudentData, getStudentDataById, updateStudentById, updateStudentDocuments } from '../controllers/studentController';

export const studentDataRoute = express.Router();

studentDataRoute.post('/search',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getStudentData
);


studentDataRoute.get('/:id',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getStudentDataById
);


studentDataRoute.put('/:id',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    updateStudentById
);


studentDataRoute.put('/update-document',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    upload.single('document'),
    updateStudentDocuments
);