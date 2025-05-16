import express from "express";
import { downloadAdmissionForm } from "../admission/controllers/downloadController";

export const downloadRoute = express.Router()

downloadRoute.post('/admission', downloadAdmissionForm);