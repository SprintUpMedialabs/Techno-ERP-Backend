import express from 'express';
import { crmV1Routes } from './crm/routes/crmV1Routes';

export const v1Router = express.Router();

v1Router.use('/crm', crmV1Routes);