import express from 'express';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';
import { createEnquiry, getEnquiryData, updateEnquiryStep3ById, updateEnquiryDocuments, updateEnquiryStep1ById, updateEnquiryStep2ById, createEnquiryStep2, getEnquiryById } from '../controllers/enquiryFormController';
import upload from '../../config/multerConfig';


export const enquiryRoute = express.Router();

enquiryRoute.post('/step-1',
    authenticate,
    authorize([UserRoles.COUNSELOR, UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
    createEnquiry
);

enquiryRoute.put('/step-1',
    authenticate,
    authorize([UserRoles.COUNSELOR, UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
    updateEnquiryStep1ById
);

enquiryRoute.post('/step-2',
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),
    createEnquiryStep2);

enquiryRoute.put('/step-2', authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),
    updateEnquiryStep2ById);

enquiryRoute.put('/step-3', authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
    updateEnquiryStep3ById
);

enquiryRoute.post('/search',
    authenticate,
    authorize([UserRoles.COUNSELOR, UserRoles.BASIC_USER,UserRoles.REGISTAR]),   // yes i know that every one has this basic user role so in a way its available to ALL.
    getEnquiryData
)


enquiryRoute.put('/update-document',
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),  // yes i know that every one has this basic user role so in a way its available to ALL.
    upload.single('document'),
    updateEnquiryDocuments
);

enquiryRoute.get('/:id',
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),
    getEnquiryById
);