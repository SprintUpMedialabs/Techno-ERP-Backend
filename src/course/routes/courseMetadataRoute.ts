import express from 'express';
import { UserRoles } from '../../config/constants';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { createCourse, getAdmissoinDocumentListByCourseCode, getCourseCodes, getCourseFeeByCourseCodee, getCourseMetadataByCourseCode } from '../controllers/courseMetadataController';

const courseMetaDataRoute = express.Router();

courseMetaDataRoute.post('/course',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createCourse
);

courseMetaDataRoute.get('/course-code',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getCourseCodes
);

courseMetaDataRoute.get('/:courseCode',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getCourseMetadataByCourseCode
);

courseMetaDataRoute.get('/:courseCode/admission-documents',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getAdmissoinDocumentListByCourseCode
);

courseMetaDataRoute.get('/:courseCode/fee-infromation',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getCourseFeeByCourseCodee
);

export default courseMetaDataRoute;
