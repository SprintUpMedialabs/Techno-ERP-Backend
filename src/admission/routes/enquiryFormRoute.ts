import express from 'express';
import { UserRoles } from '../../config/constants';
import upload from '../../config/multerConfig';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { createEnquiryDraftStep1, updateEnquiryDraftStep1 } from '../controllers/enquiryDraftController';
import { approveEnquiry, getEnquiryById, getEnquiryData } from '../controllers/enquiryFormController';
import { createEnquiry } from '../controllers/enquiryStep1Controller';
import { createEnquiryStep2, updateEnquiryStep2ById } from '../controllers/enquiryStep2Controller';
import { saveStep3Draft, updateEnquiryDocuments, updateEnquiryStep3ById, verifyOtpAndUpdateEnquiryStatus } from '../controllers/enquiryStep3Controller';
import { updateEnquiryStep4ById } from '../controllers/enquiryStep4Controller';
import { createFeeDraft, updateFeeDraft } from '../controllers/feeDraftController';

export const enquiryRoute = express.Router();

enquiryRoute.post('/step-1',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE,UserRoles.FRONT_DESK]),
    createEnquiry
);

enquiryRoute.post('/step-2',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE,UserRoles.FRONT_DESK]),
    createEnquiryStep2
);

enquiryRoute.put('/step-2', authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE,UserRoles.FRONT_DESK]),
    updateEnquiryStep2ById
);

enquiryRoute.put('/step-3', authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE]),
    updateEnquiryStep3ById
);

enquiryRoute.post('/step-3/verify-otp', authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE]),
    verifyOtpAndUpdateEnquiryStatus
);

enquiryRoute.put('/step-4', authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE]),
    updateEnquiryStep4ById
);

enquiryRoute.post('/search',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE,UserRoles.FRONT_DESK]),
    getEnquiryData
);

enquiryRoute.put('/update-document',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE]),
    upload.single('document'),
    updateEnquiryDocuments
);

enquiryRoute.get('/:id',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE,UserRoles.FRONT_DESK]),
    getEnquiryById
);

enquiryRoute.post('/approve-enquiry',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE]),
    approveEnquiry
);

enquiryRoute.post('/create-draft-step-1',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE,UserRoles.FRONT_DESK]),
    createEnquiryDraftStep1
);

enquiryRoute.put('/update-draft-step-1',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE,UserRoles.FRONT_DESK]),
    updateEnquiryDraftStep1
);

enquiryRoute.post('/create-draft-step-2',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE,UserRoles.FRONT_DESK]),
    createFeeDraft
);

enquiryRoute.put('/update-draft-step-2',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE,UserRoles.FRONT_DESK]),
    updateFeeDraft
);


enquiryRoute.put('/save-draft-step-3',
    authenticate,
    authorize([UserRoles.REGISTAR, UserRoles.FINANCE]),
    saveStep3Draft
);