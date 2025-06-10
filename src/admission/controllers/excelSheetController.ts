import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import moment from "moment-timezone";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ApplicationStatus } from "../../config/constants";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import { Student } from "../../student/models/student";
import { formatResponse } from "../../utils/formatResponse";
import { Enquiry } from "../models/enquiry";
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
    const admissionData = await Student.find({
        startingYear: moment().year()
    }).lean();
    const studentData = admissionData.map((student) => {
        const applicableFee = student.semester[0].fees.details.reduce((acc, fee) => acc + fee.actualFee, 0);
        const totalApplicableFee = student.semester.reduce((acc, sem) => acc + sem.fees.details.reduce((acc, fee) => acc + fee.actualFee, 0), 0);
        const finalFee = student.semester[0].fees.totalFinalFee;
        const totalFinalFee = student.semester.reduce((acc, sem) => acc + sem.fees.totalFinalFee, 0);
        return {
            ...student.studentInfo,
            applicableFee,
            finalFee,
            discountApplicable: applicableFee - finalFee,
            totalDiscountApplicable: totalApplicableFee - totalFinalFee,
        }
    });
    return formatResponse(res, 200, 'Recent admission excel sheet data fetched successfully', true, studentData);
}));