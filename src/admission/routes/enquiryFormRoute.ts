import express from 'express';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';
import { getEnquiryData, getEnquiryById, approveEnquiry, updateStatus } from '../controllers/enquiryFormController';
import upload from '../../config/multerConfig';
import { createEnquiryDraftStep1, updateEnquiryDraftStep1 } from '../controllers/enquiryDraftController';
import { createFeeDraft, updateFeeDraft } from '../controllers/feeDraftController';
import { createEnquiry, updateEnquiryStep1ById } from '../controllers/enquiryStep1Controller';
import { createEnquiryStep2, updateEnquiryStep2ById } from '../controllers/enquiryStep2Controller';
import { saveStep3Draft, updateEnquiryDocuments, updateEnquiryStep3ById } from '../controllers/enquiryStep3Controller';
import { updateEnquiryStep4ById } from '../controllers/enquiryStep4Controller';

export const enquiryRoute = express.Router();

enquiryRoute.post('/step-1',
    authenticate,
    authorize([UserRoles.COUNSELOR, UserRoles.BASIC_USER]),
    createEnquiry
);

enquiryRoute.put('/step-1',
    authenticate,
    authorize([UserRoles.COUNSELOR, UserRoles.BASIC_USER]),
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
    authorize([UserRoles.REGISTAR, UserRoles.BASIC_USER]),
    updateEnquiryStep3ById
);

enquiryRoute.put('/step-4', authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.BASIC_USER]),
    updateEnquiryStep4ById
);

enquiryRoute.post('/search',
    authenticate,
    authorize([UserRoles.COUNSELOR, UserRoles.BASIC_USER, UserRoles.REGISTAR]),
    getEnquiryData
)

enquiryRoute.put('/update-document',
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),
    upload.single('document'),
    updateEnquiryDocuments
);

enquiryRoute.get('/:id',
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),
    getEnquiryById
);

enquiryRoute.post('/approve-enquiry',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.BASIC_USER]),
    approveEnquiry
);

// enquiryRoute.put('/update-status',
//     authenticate,
//     authorize([UserRoles.COUNSELOR, UserRoles.REGISTAR, UserRoles.BASIC_USER]),
//     updateStatus
// )

enquiryRoute.post('/create-draft-step-1',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.BASIC_USER]),
    createEnquiryDraftStep1
);

enquiryRoute.put('/update-draft-step-1',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.BASIC_USER]),
    updateEnquiryDraftStep1
);

enquiryRoute.post('/create-draft-step-2',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.BASIC_USER]),
    createFeeDraft
);

enquiryRoute.put('/update-draft-step-2',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.BASIC_USER]),
    updateFeeDraft
);


enquiryRoute.put('/save-draft-step-3',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.BASIC_USER]),
    saveStep3Draft
);