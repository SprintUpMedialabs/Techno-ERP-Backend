import express from "express"
import { studentLogin, studentLogout } from "../../controllers/studentAuthenticationController";
import { authenticate  } from "../../../middleware/jwtStudentAuthenticationMiddleware";
export const studentAuthRoute = express.Router();

studentAuthRoute.post('/login', studentLogin);
studentAuthRoute.get('/logout', authenticate, studentLogout);
