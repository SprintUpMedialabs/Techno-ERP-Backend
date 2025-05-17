import express from "express";
import { downloadAdmissionForm } from "../admission/controllers/downloadController";
import { downloadTransactionSlip } from "../student/controllers/downloadController";

export const downloadRoute = express.Router()

downloadRoute.post('/admission', downloadAdmissionForm);
downloadRoute.post('/transaction-slip', downloadTransactionSlip)