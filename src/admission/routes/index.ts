import express from 'express';
import { enquiryFromRoute } from './enquiryFormRoute';
import { feeRoute } from './feeRoute';

export const admissionRoute = express.Router();

admissionRoute.use('/enquiry-form', enquiryFromRoute);

// DTODO: lets keep here just '/fee'
admissionRoute.use('/fee-draft', feeRoute);