import express from "express";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { UserRoles } from "../../config/constants";
import { getStudentDataById } from "../../student-data/controllers/studentController";

export const studentRepoRoute = express.Router();

studentRepoRoute.get("/:id", 
    authenticate, 
    authorize([UserRoles.BASIC_USER]), 
    getStudentDataById
);


