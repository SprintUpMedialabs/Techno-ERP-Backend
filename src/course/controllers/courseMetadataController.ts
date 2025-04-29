import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { formatResponse } from "../../utils/formatResponse";
import { CourseMetaData } from "../models/courseMetadata";

export const getCourseMetadataBy = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
