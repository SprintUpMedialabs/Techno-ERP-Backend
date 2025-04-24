import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { AuthenticatedRequest } from '../auth/validators/authenticatedRequest';

export const getStudentDetails = expressAsyncHandler(async(req:AuthenticatedRequest, res:Response)=>{
    const {courseCode,academicYear} = req.body;

    
});