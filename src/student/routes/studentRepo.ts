import express from "express";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { UserRoles } from "../../config/constants";
import { getStudentDataById, getStudentDataBySearch, updateStudentDataById, updateStudentDocumentsById, updateStudentPhysicalDocumentById } from "../controllers/studentController";
import upload from "../../config/multerConfig";
import { exportStudentData } from "../controllers/studentDataSheetController";

export const studentRepoRoute = express.Router();

studentRepoRoute.get('/export-data',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    exportStudentData
);

studentRepoRoute.post('/search',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getStudentDataBySearch
)

studentRepoRoute.get("/:id",
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getStudentDataById
);

studentRepoRoute.put('/student-details',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    updateStudentDataById
);

studentRepoRoute.put('/student-physical-document',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    updateStudentPhysicalDocumentById
);

studentRepoRoute.put('/document',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    upload.single('document'),
    updateStudentDocumentsById
);


