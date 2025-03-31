import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { formatResponse } from "../../utils/formatResponse";
import { Types } from "mongoose";
import { DepartmentModel } from "../models/department";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";

// DTODO : On deleting semester, the total number of semesters in course should change. YES
export const deleteSemester = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseId, semesterId } = req.body;

    if (!Types.ObjectId.isValid(semesterId)) {
        throw createHttpError(400, "Invalid Semester ID");
    }

    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        { "courses._id": courseId }, 
        { $pull: { "courses.$.semester": { _id: semesterId } } },  
        { new: true, projection: { "courses": { $elemMatch: { _id: courseId } } } } 
    );

    if (!updatedDepartment || updatedDepartment.courses.length === 0) {
        throw createHttpError(404, "Semester not deleted.");
    }


    return formatResponse(res, 200, "Semester deleted successfully", true, updatedDepartment);
});

// DTODO: create semester