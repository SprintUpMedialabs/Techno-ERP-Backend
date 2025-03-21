import express from 'express';
import { createFeesDraft, getFeesDraftByEnquiryId, searchEnquiries, updateFeesDraft } from '../controllers/feesDraftController';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';

export const feeRoute = express.Router();

feeRoute.post('/search-using-enquiry-id', // DTODO: should be like /get-enquiries isn't it?
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]), 
    searchEnquiries);

feeRoute.post('/get-draft-enquiry-id',
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]), 
    getFeesDraftByEnquiryId);

// DTODO: it should be just like / only isn't it?
feeRoute.post('/create-fee-draft', authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]), 
    createFeesDraft);

// DTODO: this can be put call '/'
feeRoute.post('/update-fee-draft', authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]), 
    updateFeesDraft);