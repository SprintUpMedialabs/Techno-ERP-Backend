import express from "express"
import { getStudentInformation } from "../controllers/studentParentController"

export const studentParentRoute = express.Router()

studentParentRoute.post('/get-info', getStudentInformation)