import mongoose from "mongoose";
import { Enquiry } from "../../admission/models/enquiry"
import { Student } from "../../student/models/student";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { formatResponse } from "../../utils/formatResponse";

export const addRemark2and4 = expressAsyncHandler(async (req: Request, res: Response) => {
  try {

    //take alll enquiry which have remark2 or remark4
    const enquires = await Enquiry.find({
      $or: [
        { remark2: { $exists: true } },
        { remark4: { $exists: true } }
      ]
    })

    //update remark2 and remark4 in feeDetailsRemark and financeOfficeRemark
    //and save it in updatedEnquiries map with _id as key and combined remark as value
    let updatedEnquiries = new Map<string, string>();
    enquires.map(enquiry => {
      const updatedRemark2 = enquiry.feeDetailsRemark ? enquiry.feeDetailsRemark + " | " : '';
      const updatedRemark4 = enquiry.financeOfficeRemark ?? '';

      const combinedRemark = updatedRemark2 + updatedRemark4;
      updatedEnquiries.set(enquiry._id.toString(), combinedRemark);
    });

    //take all ids
    const ids = Array.from(updatedEnquiries.keys()).map(id => new mongoose.Types.ObjectId(id));

    //get students
    const students = await Student.find(
      { _id: { $in: ids } },
    );

    //update students with combined remark
    for (const student of students) {
      student.step2And4Remark = updatedEnquiries.get(student._id.toString()) || '';
      await student.save();
    }

    return formatResponse(res, 200, "step2And4Remark updated successfully for students", true, {});

  } catch (error: Error | any) {
    return formatResponse(res, 500, "Failed to update step2And4Remark for students", false, {
      error: error.message ?? "An unexpected error occurred"
    });
  }
});