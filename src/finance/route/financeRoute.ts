import express from 'express';
import { recordPayment } from '../controllers/financeController';

export const transactionRoute = express.Router();

transactionRoute.post("/get-all-txn", recordPayment);