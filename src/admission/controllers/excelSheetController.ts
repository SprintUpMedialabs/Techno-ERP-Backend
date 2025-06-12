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
    type FeeDetail = {
        actualFee: number;
    };

    type Semester = {
        fees: {
            details: FeeDetail[];
            totalFinalFee: number;
        };
    };
    type AggregatedStudent = {
        _id: string;
        studentInfo: any;
        semester: Semester[];
        telecaller?: string[];
        counsellor?: string[];
        enquiryRemark?: string;
        feeDetailsRemark?: string;
        registarOfficeRemark?: string;
        financeOfficeRemark?: string;
    };
    const currentYear = moment().year();

    const studentData = await Student.aggregate([
        {
            $match: {
                startingYear: currentYear
            }
        },
        {
            $lookup: {
                from: "enquiries", // Ensure this matches the actual collection name in MongoDB (pluralized by default)
                localField: "_id",
                foreignField: "_id",
                as: "enquiry"
            }
        },
        {
            $unwind: {
                path: "$enquiry",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                "studentInfo": 1,
                "semester": 1,
                "telecaller": "$enquiry.telecaller",
                "course": "$enquiry.course",
                "dateOfAdmission": "$enquiry.dateOfAdmission",
                "counsellor": "$enquiry.counsellor",
                "enquiryRemark": "$enquiry.enquiryRemark",
                "feeDetailsRemark": "$enquiry.feeDetailsRemark",
                "registarOfficeRemark": "$enquiry.registarOfficeRemark",
                "financeOfficeRemark": "$enquiry.financeOfficeRemark",
            }
        }
    ]); 

    const formattedData = studentData.map(student => {
        const applicableFee = student.semester?.[0]?.fees?.details?.reduce((acc: number, fee: FeeDetail) => acc + fee.actualFee, 0) || 0;
        const totalApplicableFee = student.semester?.reduce((acc: number, sem: Semester) => acc + sem.fees.details.reduce((acc: number, fee: FeeDetail) => acc + fee.actualFee, 0), 0) || 0;
        const finalFee = student.semester?.[0]?.fees?.totalFinalFee || 0;
        const totalFinalFee = student.semester?.reduce((acc: number, sem: Semester) => acc + sem.fees.totalFinalFee, 0) || 0;

        return {
            ...student.studentInfo,
            applicableFee,
            finalFee,
            discountApplicable: applicableFee - finalFee,
            totalDiscountApplicable: totalApplicableFee - totalFinalFee,
            telecaller: student.telecaller || [],
            dateOfAdmission: student.dateOfAdmission,
            course: student.course,
             counsellor: student.counsellor || [],
            enquiryRemark: student.enquiryRemark || '',
            feeDetailsRemark: student.feeDetailsRemark || '',
            registarOfficeRemark: student.registarOfficeRemark || '',
            financeOfficeRemark: student.financeOfficeRemark || '',
        };
    });

    return formatResponse(res, 200, 'Recent admission excel sheet data fetched successfully', true, formattedData);
}));
