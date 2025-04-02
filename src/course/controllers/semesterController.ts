import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { formatResponse } from "../../utils/formatResponse";
import { Types } from "mongoose";
import { DepartmentModel } from "../models/department";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ISemesterCreateSchema, semesterRequestSchema } from "../validators/semesterSchema";

// DTODO : On deleting semester, the total number of semesters in course should change. => DONE
export const deleteSemester = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseId, semesterId } = req.body;

    if (!Types.ObjectId.isValid(semesterId)) {
        throw createHttpError(400, "Invalid Semester ID");
    }

    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        { "courses._id": courseId },
        {
            $pull: { "courses.$.semester": { _id: semesterId } },
            $inc: { "courses.$.totalSemesters": -1 }
        },
        { new: true, projection: { "courses": { $elemMatch: { _id: courseId } } }, runValidators: true }
    );

    if (!updatedDepartment || updatedDepartment.courses.length === 0) {
        throw createHttpError(404, "Semester not deleted.");
    }

    return formatResponse(res, 200, "Semester deleted successfully", true, updatedDepartment);
});

// DTODO: lets return only course rather than department.

export const createSemester = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const createSemesterData: ISemesterCreateSchema = req.body;

    const validation = semesterRequestSchema.safeParse(createSemesterData);

    if (!validation.success)
    {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const { courseId, semesterNumber } = validation.data;

    const semesterData = {
        semesterNumber: semesterNumber,
        subjectDetails: []
    }

    // DTODO: lets use isExist  here.
    const existingCourse = await DepartmentModel.findOne({
        "courses._id": courseId,
        "courses.semester.semesterNumber": semesterNumber
    });

    if (existingCourse) 
    {
        throw createHttpError(400, `Semester ${semesterNumber} already exists in this course, please update if required.`);
    }

    const updatedCourse = await DepartmentModel.findOneAndUpdate(
        {
            "courses._id": courseId,
        },
        {
            $push: { "courses.$.semester": semesterData },
            $inc: { "courses.$.totalSemesters": 1 }
        },
        { new: true, projection: { "courses": { $elemMatch: { _id: courseId } } }, runValidators: true }
    );

    return formatResponse(res, 200, "Semester created successfully", true, updatedCourse);
});