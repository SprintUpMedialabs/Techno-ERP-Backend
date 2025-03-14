import express from 'express';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';
import { createEnquiry } from '../controllers/enquiryFormController';

export const enquiryFromRoute = express.Router();

enquiryFromRoute.post('/create',
    authenticate,
    authorize([UserRoles.COUNSELOR,UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
    createEnquiry
);