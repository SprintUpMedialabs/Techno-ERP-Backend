import express from 'express';
import { createFeesDraft, getFeesDraftByEnquiryId, searchEnquiries, updateFeesDraft } from '../controllers/feesDraftController';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';

export const feeRoute = express.Router();

feeRoute.post('/search-using-enquiry-id',
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]), 
    searchEnquiries);

feeRoute.post('/get-draft-enquiry-id',
    authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]), 
    getFeesDraftByEnquiryId);

feeRoute.post('/create-fee-draft', authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]), 
    createFeesDraft);

feeRoute.post('/update-fee-draft', authenticate,
    authorize([UserRoles.BASIC_USER, UserRoles.COUNSELOR]), 
    updateFeesDraft);