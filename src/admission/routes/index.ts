import express from 'express';
import { enquiryRoute } from './enquiryFormRoute';

export const admissionRoute = express.Router();

admissionRoute.use('/enquiry', enquiryRoute);