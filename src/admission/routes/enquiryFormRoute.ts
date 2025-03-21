import express from 'express';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';
import { createEnquiry, getEnquiryData, updateEnquiryData, updateEnquiryDocuments } from '../controllers/enquiryFormController';
import upload from '../../config/multerConfig';

export const enquiryFromRoute = express.Router();

enquiryFromRoute.post('/create-enquiry',
    authenticate,
    authorize([UserRoles.COUNSELOR, UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
    createEnquiry
);

enquiryFromRoute.put('/update-enquiry',
    authenticate,
    authorize([UserRoles.COUNSELOR, UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
    updateEnquiryData
);


enquiryFromRoute.post('/get-enquiry',
    authenticate,
    authorize([UserRoles.COUNSELOR, UserRoles.BASIC_USER]),   // yes i know that every one has this basic user role so in a way its available to ALL.
    getEnquiryData
)


enquiryFromRoute.put('/update-document', 
    authenticate, 
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),  // yes i know that every one has this basic user role so in a way its available to ALL.
    upload.single('document'), 
    updateEnquiryDocuments
);