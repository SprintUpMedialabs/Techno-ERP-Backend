import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { formatResponse } from "../../utils/formatResponse";
import { CourseMetaData } from "../models/courseMetadata";

export const createCourse = expressAsyncHandler(async(req:AuthenticatedRequest,res:Response)=>{
    const course = await CourseMetaData.create(req.body);
    console.log(course);
    return formatResponse(res,200,'Course Created Succesffully',true,course);
});

export const getCourseCodes = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const courseList = await CourseMetaData.find().select('courseCode');
    const courseCodes = courseList.map(course => course.courseCode);
    return formatResponse(res, 200, 'Course Codes fetched successfully.', true, courseCodes);
});

export const getCourseMetadataByCourseCode = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode } = req.params;
    const courseMetadata = await CourseMetaData.findOne({ courseCode });
    if (!courseMetadata) {
        return formatResponse(res, 404, 'Course metadata not found', false);
    }
    return formatResponse(res, 200, 'Course metadata fetched successfully', true, courseMetadata);
});

export const getAdmissoinDocumentListByCourseCode = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode } = req.params;
    const courseMetadata = await CourseMetaData.findOne({ courseCode });
    if (!courseMetadata) {
        return formatResponse(res, 404, 'Course metadata not found', false);
    }
    return formatResponse(res, 200, 'Course metadata fetched successfully', true, { documentTypeList: courseMetadata.documentType });
});

export const getCourseFeeByCourseCodee = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode } = req.params;
    const courseFee = CourseMetaData.findOne({ courseCode });
    console.log(courseFee);
    return formatResponse(res, 200, 'Course Fee infromation', true, courseFee);
})