import { Request, Response } from "express";
import moment from "moment-timezone";
import { Enquiry } from "../../admission/models/enquiry";
import { EnquiryDraft } from "../../admission/models/enquiryDraft";
import { Student } from "../../student/models/student";

export const updateAdmissionDate = async (req: Request, res: Response) => {
    const entries = [
      {
        phoneNumber: "6394327916",
        dateOfAdmission: "11/06/2025"
      },
    //   {
    //     phoneNumber: "9511153997",
    //     dateOfAdmission: "27/05/2025"
    //   },
    //   {
    //     phoneNumber: "9696345324",
    //     dateOfAdmission: "20/06/2025"
    //   },
    ];
  
    for (const entry of entries) {
      const { phoneNumber, dateOfAdmission } = entry;
  
      if (!phoneNumber || !dateOfAdmission) continue;
  
      const admissionDate = moment(dateOfAdmission, "DD/MM/YYYY").startOf('day').toDate();
      // console.log(admissionDate);
      // Update Enquiry
      await Enquiry.findOneAndUpdate(
        { studentPhoneNumber: phoneNumber },
        { dateOfAdmission: admissionDate }
      );
  
      // Update EnquiryDraft
      await EnquiryDraft.findOneAndUpdate(
        { studentPhoneNumber: phoneNumber },
        { dateOfAdmission: admissionDate }
      );
  
      // Update Student
      const student = await Student.findOne({ 'studentInfo.studentPhoneNumber': phoneNumber })
        .populate('transactionHistory');
  
    //   if (student) {
    //     // Update studentInfo.dateOfAdmission
    //     student.studentInfo.dateOfAdmission = admissionDate;
  
    //     // Update each transaction's dateTime
    //     for (const txn of student.transactionHistory) {
    //       txn.dateTime = admissionDate;
    //       await txn.save(); // Save each transaction separately
    //     }
    //     // console.log(student.transactionHistory);
    //     await student.save();
    //   }else{
    //     console.log(`Student not found for phone number: ${phoneNumber}`);
    //   }
    }
    res.send('done');
  };