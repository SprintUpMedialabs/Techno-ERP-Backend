import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { formatResponse } from "../../utils/formatResponse";
import { CourseMetaData } from "../models/courseMetadata";
import createHttpError from "http-errors";

export const createCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const course = await CourseMetaData.create(req.body);
    return formatResponse(res, 200, 'Course Created Succesffully', true, course);
});

export const getCourseCodes = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const courseList = await CourseMetaData.find().select('courseCode courseName');
    const courseCodeList = courseList.map(course => ({ courseCode: course.courseCode, courseName: course.courseName }));
    return formatResponse(res, 200, 'Course Codes fetched successfully.', true, courseCodeList);
});

export const getCourseMetadataByCourseCode = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode } = req.params;
    const courseMetadata = await CourseMetaData.findOne({ courseCode });
    if (!courseMetadata) {
        throw createHttpError(404, 'Course metadata not found');
    }
    return formatResponse(res, 200, 'Course metadata fetched successfully', true, courseMetadata);
});

export const getAdmissoinDocumentListByCourseCode = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode } = req.params;
    const courseMetadata = await CourseMetaData.findOne({ courseCode });
    if (!courseMetadata) {
        throw createHttpError(404, 'Course metadata not found');
    }
    return formatResponse(res, 200, 'Course metadata fetched successfully', true, { documentTypeList: courseMetadata.documentType });
});

export const getCourseFeeByCourseCodee = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode } = req.params;
    console.log(courseCode)
    const courseFee = await CourseMetaData.findOne({ courseCode }).select('fee');
    if (!courseFee) {
        throw createHttpError(404, 'Course metadata not found');
    }
    return formatResponse(res, 200, 'Course Fee infromation', true, courseFee);
})