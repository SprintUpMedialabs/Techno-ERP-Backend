import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { toWords } from 'number-to-words';
import { CollegeMetaData } from "../../admission/models/collegeMetaData";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { toTitleCase } from "../../crm/validators/formators";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";
import { formatResponse } from "../../utils/formatResponse";
import { CollegeTransaction } from "../models/collegeTransactionHistory";
import { Student } from "../models/student";
import createHttpError from "http-errors";
import { FinanceFeeType } from "../../config/constants";

export const downloadTransactionSlip = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { studentId, transactionId } = req.body;
    const responseObj = await getTransactionSlipData(studentId, transactionId, false);
    return formatResponse(res, 200, "Transaction Slip Data fetched successfully", true, responseObj);
})

export const downloadAdmissionTransactionSlip = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { studentId } = req.body;
    const responseObj = await getTransactionSlipData(studentId, "", true);
    return formatResponse(res, 200, "Admission Transaction Slip Data fetched successfully", true, responseObj);
})

const formateFeeType = (feeType: FinanceFeeType) => {
    switch (feeType) {
        case FinanceFeeType.HOSTELCAUTIONMONEY:
            return "Hostel Caution Money";
        case FinanceFeeType.HOSTELMAINTENANCE:
            return "Hostel Maintenance";
        case FinanceFeeType.HOSTELYEARLY:
            return "Hostel Yearly";
        case FinanceFeeType.TRANSPORT:
            return "Transport";
        case FinanceFeeType.PROSPECTUS:
            return "Prospectus";
        case FinanceFeeType.STUDENTID:
            return "Student ID";
        case FinanceFeeType.UNIFORM:
            return "Uniform";
        case FinanceFeeType.STUDENTWELFARE:
            return "Student Welfare";
        case FinanceFeeType.BOOKBANK:
            return "Book Bank";
        case FinanceFeeType.EXAMFEES:
            return "Exam Fees";
        case FinanceFeeType.MISCELLANEOUS:
            return "Miscellaneous";
        case FinanceFeeType.SEMESTERFEE:
            return "Semester Fee";
        default:
            return feeType;
    }
}

export const getTransactionSlipData = async (studentId: string, transactionId: string, isAdmissionTransactionSlip: boolean) => {
    const student = await Student.findById(studentId);
    if (!student)
        throw createHttpError(400, "Student not found");
    const dues: { label: string, amount: number }[] = [];
    student?.semester.forEach(semester => {
        if (semester.fees.dueDate) {
            semester.fees.details.forEach(fee => {
                if (fee.paidAmount != fee.finalFee) {
                    dues.push({ label: `Sem ${semester.semesterNumber} - ${formateFeeType(fee.type)}`, amount: fee.finalFee - fee.paidAmount });
                }
            });
        }
    })
    if (isAdmissionTransactionSlip)
        transactionId = student?.transactionHistory?.at(0)?.toString() ?? '';

    const collegeTransaction = await CollegeTransaction.findById(transactionId);
    const collegeMetaData = await CollegeMetaData.findOne({ name: student?.collegeName })
    const responseObj = {
        collegeName: collegeMetaData?.fullCollegeName,
        affiliationName: collegeMetaData?.fullAffiliation,
        collegeFeeEmail: collegeMetaData?.collegeFeeEmail,
        collegeFeeContactNumber: collegeMetaData?.collegeFeeContact,
        recieptNumber: collegeTransaction?.transactionID,
        studentName: student?.studentInfo.studentName,
        fatherName: student?.studentInfo.fatherName,
        course: student?.courseName,
        date: convertToDDMMYYYY(collegeTransaction?.dateTime),
        category: student?.studentInfo.category,
        session: student?.currentAcademicYear,
        particulars: collegeTransaction?.transactionSettlementHistory,
        remarks: collegeTransaction?.remark,
        amountInWords: toTitleCase(toWords(collegeTransaction?.amount!)) + " Rupees Only",
        transactionType: collegeTransaction?.txnType,
        dues: dues
    }
    return responseObj;
}