import express from 'express';
import { enquiryFromRoute } from './enquiryFormRoute';

export const admissionRoute = express.Router();

admissionRoute.use('/enquiry-form', enquiryFromRoute);