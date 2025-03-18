import express from 'express';
import { transactionRoute } from './financeRoute';

export const financeRoute = express.Router();

financeRoute.use('/finance', transactionRoute);