import expressAsyncHandler from "express-async-handler";
import { Response } from "express";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import { ApplicationStatus } from "../../config/constants";
import { Enquiry } from "../models/enquiry";
import { formatResponse } from "../../utils/formatResponse";

export const getRecentEnquiryExcelSheetData = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
    const enquiryData = await Enquiry.find({
        applicationStatus: { $ne: ApplicationStatus.CONFIRMED }
    });
    return formatResponse(res, 200, 'Recent enquiry excel sheet data fetched successfully', true, enquiryData);
}));

export const getRecentAdmissionExcelSheetData = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
    const admissionData = await Enquiry.find({
        applicationStatus: ApplicationStatus.CONFIRMED
    });
    return formatResponse(res, 200, 'Recent admission excel sheet data fetched successfully', true, admissionData);
}));
