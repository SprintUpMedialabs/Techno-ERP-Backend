import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import express from 'express';
import { deleteFileFromS3UsingUrl } from "../controllers/testController";

export const testRoute = express.Router()

testRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    deleteFileFromS3UsingUrl
);
