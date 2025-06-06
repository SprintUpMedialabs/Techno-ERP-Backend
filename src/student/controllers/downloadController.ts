import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { response, Response } from "express";
import { Student } from "../models/student";
import { CollegeTransaction } from "../models/collegeTransactionHistory";
import { CollegeMetaData } from "../../admission/models/collegeMetaData";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";
import { toWords } from 'number-to-words';
import { formatResponse } from "../../utils/formatResponse";
import { toTitleCase } from "../../crm/validators/formators";

export const downloadTransactionSlip = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{
    const { studentId, transactionId } = req.body; 
    const responseObj = await getTransactionSlipData(studentId, transactionId, false);
    return formatResponse(res, 200, "Transaction Slip Data fetched successfully", true, responseObj);
})

export const downloadAdmissionTransactionSlip = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{
    const { studentId } = req.body;
    const responseObj = await getTransactionSlipData(studentId, "", true);
    console.log("Response Object : ", responseObj)
    return formatResponse(res, 200, "Admission Transaction Slip Data fetched successfully", true, responseObj);
})

export const getTransactionSlipData = async (studentId : string, transactionId : string, isAdmissionTransactionSlip: boolean) => {
    const student = await Student.findById(studentId);

    if(isAdmissionTransactionSlip)
        transactionId = student?.transactionHistory?.at(0)?.toString() ?? '';

    const collegeTransaction = await CollegeTransaction.findById(transactionId);
    const collegeMetaData = await CollegeMetaData.findOne({ name : student?.collegeName })
    const responseObj = {
        collegeName : collegeMetaData?.fullCollegeName,
        affiliationName: collegeMetaData?.fullAffiliation,
        collegeEmail : collegeMetaData?.collegeEmail,
        collegeContactNumber : collegeMetaData?.collegeContact,
        recieptNumber : collegeTransaction?.transactionID,
        studentName : student?.studentInfo.studentName,
        fatherName : student?.studentInfo.fatherName,
        course : student?.courseName,
        date : convertToDDMMYYYY(collegeTransaction?.dateTime),
        category : student?.studentInfo.category,
        session : student?.currentAcademicYear,
        particulars : collegeTransaction?.transactionSettlementHistory,
        remarks : collegeTransaction?.remark,
        amountInWords : toTitleCase(toWords(collegeTransaction?.amount!)) + " Rupees Only",
        transactionType : collegeTransaction?.txnType
    }
    return responseObj;
}