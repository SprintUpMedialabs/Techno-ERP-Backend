import express from "express"
import { UserRoles } from "../../config/constants"
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware"
import { createSchedule, updateSchedule, deleteSchedule } from "../controllers/scheduleController"

export const scheduleRoute = express.Router()

scheduleRoute.post('/',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    createSchedule
)

scheduleRoute.put('/:id',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    updateSchedule
)

scheduleRoute.delete('/semester/subject/schedule/:id',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    deleteSchedule
)