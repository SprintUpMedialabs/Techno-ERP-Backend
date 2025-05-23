import expressAsyncHandler from "express-async-handler";
import { CookieOptions, Request, Response} from "express";
import { IStudentLoginRequest, loginRequestSchema } from "../validators/auth/auth";
import createHttpError from "http-errors";
import { Student } from "../models/student";
import bcrypt from 'bcrypt';
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";
import { studentJwtHelper } from "../../utils/jwtHelper";
import { formatResponse } from "../../utils/formatResponse";
import { UserRoles } from "../../config/constants";

export const studentLogin = expressAsyncHandler(async (req: Request, res: Response) => {
    const data: IStudentLoginRequest = req.body;
  
    const validation = loginRequestSchema.safeParse(data);
  
    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }
  
    const student = await Student.findOne({ 'studentInfo.universityId': validation.data.universityId });
    if (!student) {
      throw createHttpError(404, 'Student not found. Please reverify your admission.');
    }

    const expectedPassword = convertToDDMMYYYY(student.studentInfo.dateOfBirth);

    if (validation.data.password !== expectedPassword) {
        throw createHttpError(400, 'Invalid password.');
    }
  
    const payload = {
      id: student._id,
      name: student.studentInfo.studentName,
      universityId: student.studentInfo.universityId,
      roles: [UserRoles.STUDENT]
    };
    
    const token = studentJwtHelper.createToken(payload, {expiresIn : '15d'})

    const options: CookieOptions = {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    };
  
    res.cookie('token', token, options);
  
    return formatResponse(res, 200, 'Logged in successfully', true, {
      token: token,
      roles: [UserRoles.STUDENT],
      userData: {
        name: student.studentInfo.studentName,
        universityId: student.studentInfo.universityId
      }
    })
});
  
export const studentLogout = (req: Request, res: Response) => {
    res.cookie('token', '', {
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
  
    return formatResponse(res, 200, 'Logged out successfully', true);
};