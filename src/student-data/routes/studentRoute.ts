import express from 'express';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';
import { getStudentData, getStudentDataById, updateEnquiryDocuments, updateStudentById } from '../controllers/studentController';
import upload from '../../config/multerConfig';

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
)


studentDataRoute.put(':/id',
    authenticate, 
    authorize([UserRoles.BASIC_USER]),
    updateStudentById
);


studentDataRoute.put('/update-document',
    authenticate,
    authorize([UserRoles.BASIC_USER]), 
    upload.single('document'),
    updateEnquiryDocuments
);