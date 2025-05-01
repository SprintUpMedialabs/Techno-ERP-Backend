import express from "express";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { UserRoles } from "../../config/constants";
import { getStudentDues } from "../controllers/studentDuesController";

export const studentRoute = express.Router();

studentRoute.post("/active-dues", 
    authenticate, 
    authorize([UserRoles.BASIC_USER]), 
    getStudentDues
);