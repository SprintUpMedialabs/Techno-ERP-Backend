import express from "express";
import { downloadAdmissionForm } from "../admission/controllers/downloadController";
import { downloadAdmissionTransactionSlip, downloadTransactionSlip } from "../student/controllers/downloadController";

export const downloadRoute = express.Router()

downloadRoute.post('/admission', downloadAdmissionForm);
downloadRoute.post('/transaction-slip', downloadTransactionSlip)
downloadRoute.post('/admission-transaction-slip', downloadAdmissionTransactionSlip);

export const otpRoute = express.Router();
