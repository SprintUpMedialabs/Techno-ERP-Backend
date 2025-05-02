import express from "express";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { UserRoles } from "../../config/constants";
import { getStudentDues } from "../controllers/studentDuesController";

export const studentFeeRoute = express.Router();

studentFeeRoute.post("/active-dues", 
    authenticate, 
    authorize([UserRoles.BASIC_USER]), 
    getStudentDues
);