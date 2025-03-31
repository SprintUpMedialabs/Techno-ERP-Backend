import express from "express";
import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import {  deleteSemester } from "../controllers/semesterController";
import { subjectRoute } from "./subjectRoute";

export const semesterRoute = express.Router();

// DACHECK : As per our last discussion, we have decided to just keep the deleteSemester option and not create or update, but I want to add one semester in some course, how will it happen in that case?

semesterRoute.delete('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    deleteSemester
);

semesterRoute.use('/subject', subjectRoute);