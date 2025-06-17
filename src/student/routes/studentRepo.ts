import express from "express";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { UserRoles } from "../../config/constants";
import { getStudentDataById, getStudentDataBySearch, updateStudentDataById, updateStudentDocumentsById, updateStudentPhysicalDocumentById } from "../controllers/studentController";
import upload from "../../config/multerConfig";
import { exportStudentData } from "../controllers/studentDataSheetController";

export const studentRepoRoute = express.Router();

studentRepoRoute.get('/export-data',
    authenticate,
    authorize([UserRoles.FRONT_DESK,UserRoles.REGISTAR,UserRoles.FINANCE]),
    exportStudentData
);

studentRepoRoute.post('/search',
    authenticate,
    authorize([UserRoles.FRONT_DESK,UserRoles.REGISTAR,UserRoles.FINANCE]),
    getStudentDataBySearch
)

studentRepoRoute.get("/:id",
    authenticate,
    authorize([UserRoles.FRONT_DESK,UserRoles.REGISTAR,UserRoles.FINANCE]),
    getStudentDataById
);

studentRepoRoute.put('/student-details',
    authenticate,
    authorize([UserRoles.REGISTAR,UserRoles.FINANCE]),
    updateStudentDataById
);

studentRepoRoute.put('/student-physical-document',
    authenticate,
    authorize([UserRoles.REGISTAR,UserRoles.FINANCE]),
    updateStudentPhysicalDocumentById
);

studentRepoRoute.put('/document',
    authenticate,
    authorize([UserRoles.REGISTAR,UserRoles.FINANCE]),
    upload.single('document'),
    updateStudentDocumentsById
);