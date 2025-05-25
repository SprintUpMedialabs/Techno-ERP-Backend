import express from "express"
import { getScheduleInformation, getStudentInformation } from "../controllers/studentParentController"
import { UserRoles } from "../../config/constants"
import { authenticate, authorize } from "../../middleware/jwtStudentAuthenticationMiddleware"

export const studentParentRoute = express.Router()

studentParentRoute.get('/get-info', authenticate, authorize([UserRoles.STUDENT]),getStudentInformation)
studentParentRoute.post('/schedule-info',authenticate, authorize([UserRoles.STUDENT]), getScheduleInformation)