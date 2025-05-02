import express from "express";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { UserRoles } from "../../config/constants";
import { getStudentDataById, getStudentDataBySearch, updateStudentDataById, updateStudentPhysicalDocumentById } from "../controllers/studentController";

export const studentRepoRoute = express.Router();

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