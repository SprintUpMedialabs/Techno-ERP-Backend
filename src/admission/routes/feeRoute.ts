import express from 'express';
import { createFeesDraft, getEnquiryDataForApproval, getFeesDraftByEnquiryId, updateFeesDraft } from '../controllers/feesDraftController';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';

export const feeRoute = express.Router();

// feeRoute.post('/search-using-enquiry-id', // DTODO: should be like /get-enquiries isn't it? => NO need of this call only as we have kept in /get-enquiry
//     authenticate,
//     authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]), 
//     getEnquiryData);

feeRoute.post('/get-draft-enquiry-id',
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),
    getFeesDraftByEnquiryId);

// DTODO: it should be just like / only isn't it? => Need to discuss
feeRoute.post('/create-fee-draft', authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),
    createFeesDraft);

// DTODO: this can be put call '/' => Changed to PUT call.
feeRoute.put('/update-fee-draft', authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]),
    updateFeesDraft);

feeRoute.post('/approve-enquiry', authenticate, 
    authorize([UserRoles.BASIC_USER]), 
    getEnquiryDataForApproval); 

