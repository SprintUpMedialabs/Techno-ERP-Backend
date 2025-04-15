import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import express from 'express';
import { batchUpdatePlan, createPlan, deleteFileFromS3UsingUrl, deletePlan, getScheduleInformation } from "../controllers/scheduleController";
import upload from "../../config/multerConfig";
import { uploadAdditionalResources, uploadScheduleDocument } from "../controllers/uploadScheduleDocumentController";
export const scheduleRoute = express.Router()

scheduleRoute.post('/plan', 
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createPlan
);

scheduleRoute.put('/plan', 
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    batchUpdatePlan
);

scheduleRoute.delete('/plan', 
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    deletePlan
);

scheduleRoute.post('/schedule-details', 
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getScheduleInformation
);

scheduleRoute.put('/upload-plan', 
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    upload.single('document'),
    uploadScheduleDocument
);


scheduleRoute.put('/upload-additional-resource', 
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    upload.single('document'),
    uploadAdditionalResources
);


scheduleRoute.post('/delete-file', 
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    deleteFileFromS3UsingUrl
);