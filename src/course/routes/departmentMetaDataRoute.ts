import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import express from 'express';
import { createDepartmentMetaData, getDepartmentMetaData, updateDepartmentMetaData } from "../controllers/departmentMetaDataController";

export const departmentMetaDataRoute = express.Router()

departmentMetaDataRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createDepartmentMetaData
);


departmentMetaDataRoute.put('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    updateDepartmentMetaData
);


departmentMetaDataRoute.get('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getDepartmentMetaData
);