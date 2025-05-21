import express from "express"
import { getScheduleInformation, getStudentInformation } from "../controllers/studentParentController"

export const studentParentRoute = express.Router()

studentParentRoute.post('/get-info', getStudentInformation)
studentParentRoute.post('/schedule-info', getScheduleInformation)