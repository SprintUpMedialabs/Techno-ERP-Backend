import expressAsyncHandler from "express-async-handler";
import { Response } from "express";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import { ApplicationStatus } from "../../config/constants";
import { Enquiry } from "../models/enquiry";
import { formatResponse } from "../../utils/formatResponse";
import { EnquiryDraft } from "../models/enquiryDraft";

export const getRecentEnquiryExcelSheetData = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
    const enquiryData = await Enquiry.find({
        applicationStatus: { $ne: ApplicationStatus.CONFIRMED }
    });
    const enquiryDraftData = await EnquiryDraft.find({
        applicationStatus: { $ne: ApplicationStatus.CONFIRMED }
    });
    const allEnquiryData = [...enquiryData, ...enquiryDraftData];
    return formatResponse(res, 200, 'Recent enquiry excel sheet data fetched successfully', true, allEnquiryData);
}));

export const getRecentAdmissionExcelSheetData = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
    const admissionData = await Enquiry.find({
        applicationStatus: ApplicationStatus.CONFIRMED
    }).populate('studentFee');
    return formatResponse(res, 200, 'Recent admission excel sheet data fetched successfully', true, admissionData);
}));
