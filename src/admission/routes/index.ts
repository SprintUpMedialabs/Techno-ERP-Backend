import express from 'express';
import { enquiryFromRoute } from './enquiryFormRoute';
import { feeRoute } from './feeRoute';

export const admissionRoute = express.Router();

admissionRoute.use('/enquiry-form', enquiryFromRoute);

admissionRoute.use('/fee-draft', feeRoute);