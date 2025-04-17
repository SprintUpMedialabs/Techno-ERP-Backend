import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response, Request } from "express";
import { courseSchema, ICourseSchema } from "../validators/courseSchema";
import createHttpError from "http-errors";
import { getAcaYrFromStartYrSemNum } from "../utils/getAcaYrFromStartYrSemNum";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";

export const createCourse = expressAsyncHandler(async (req : AuthenticatedRequest, res: Response) => {
    const courseData : ICourseSchema = req.body;
    const validation = courseSchema.safeParse(courseData);
    
    if(!validation.success){
        throw createHttpError(400, validation.error.errors[0]);
    }

    const semester = Array.from({ length: courseData.totalSemesters }, (_, index) => ({
        semesterNumber: index + 1,
        academicYear: getAcaYrFromStartYrSemNum(courseData.startingYear, index),
        subjects: [],
    }));

    const course = await Course.create({ 
        ...courseData,
        semester : semester
    });

    if(!course)
        throw createHttpError(500, 'Error occurred creating course');

    return formatResponse(res, 201, 'Course created successfully', true, course);
})



export const searchCourses = async (req: Request, res: Response) => {
        //DTODO : Baaki che aa vadu, will do after discussion with DA 
};