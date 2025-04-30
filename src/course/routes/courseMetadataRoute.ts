import express from 'express';
import { UserRoles } from '../../config/constants';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { getAdmissoinDocumentListByCourseCode, getCourseMetadataBy } from '../controllers/courseMetadataController';

const courseMetaDataRoute = express.Router();

courseMetaDataRoute.get('/:courseCode',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getCourseMetadataBy
);

courseMetaDataRoute.get('/:courseCode/admission-documents',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getAdmissoinDocumentListByCourseCode
);

export default courseMetaDataRoute;
