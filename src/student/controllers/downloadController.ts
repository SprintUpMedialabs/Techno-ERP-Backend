import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { Student } from "../models/student";
import { CollegeTransaction } from "../models/collegeTransactionHistory";
import { CollegeMetaData } from "../../admission/models/collegeMetaData";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";
import { toWords } from 'number-to-words';
import { formatResponse } from "../../utils/formatResponse";

export const downloadTransactionSlip = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{
    const { studentId, transactionId } = req.body; 
    const student = await Student.findById(studentId);
    const collegeTransaction = await CollegeTransaction.findById(transactionId);
    const collegeMetaData = await CollegeMetaData.findOne({ name : student?.collegeName })
    const responseObj = {
        collegeName : collegeMetaData?.fullCollegeName,
        collegeEmail : collegeMetaData?.collegeEmail,
        collegeContactNumber : collegeMetaData?.collegeContact,
        recieptNumber : collegeTransaction?.transactionID,
        studentName : student?.studentInfo.studentName,
        fatherName : student?.studentInfo.fatherName,
        course : student?.courseName,
        date : convertToDDMMYYYY(collegeTransaction?.dateTime!),
        category : student?.studentInfo.category,
        session : student?.currentAcademicYear,
        particulars : collegeTransaction?.transactionSettlementHistory,
        remarks : collegeTransaction?.remark,
        amountInWords : toWords(collegeTransaction?.amount!),
        transactionType : collegeTransaction?.txnType
    }
    
    return formatResponse(res, 200, "Transaction Slip Data fetched successfully", true, responseObj);
})