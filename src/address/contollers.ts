import expressAsyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { Enquiry } from "../admission/models/enquiry";
import { EnquiryDraft } from "../admission/models/enquiryDraft";
import { Student } from "../student/models/student";
import { formatResponse } from "../utils/formatResponse";

export const saveAddressLine2OfStudent = expressAsyncHandler(async (req: Request, res: Response) => {
    try {
        const students = await Student.find({});
        for (const student of students) {
            const line2 = student.studentInfo.address?.addressLine2;
            if (!line2 || line2 === undefined || line2 === null) {
                if( student.studentInfo.address ) {
                    student.studentInfo.address.addressLine2 = "";
                }
                await student.save();
            }
        }
        return formatResponse(res, 200, "Address line 2 saved successfully", true, {});
    } catch (error) {
        return formatResponse(res, 500, "Error in saving address line 2", false, {});
    }
})

export const saveAddressLine2OfEnquiry = expressAsyncHandler(async (req: Request, res: Response)=> {
    try {
        const enquiries = await Enquiry.find({});
        for (const enquiry of enquiries) {
            const line2 = enquiry?.address?.addressLine2;
            if (!line2 || line2 === undefined || line2 === null) {
                if( enquiry.address ) {
                    enquiry.address.addressLine2 = "";
                }
                await enquiry.save();
            }   
        }
        return formatResponse(res, 200, "Address line 2 saved successfully", true, {});
    } catch (error) {
        return formatResponse(res, 500, "Error in saving address line 2", false, {});
    }
})

export const saveAddressLine2OfEnquiryDraft = expressAsyncHandler(async (req: Request, res: Response) => {
    try {
        const enquiryDrafts = await EnquiryDraft.find({});
        for (const enquiryDraft of enquiryDrafts) {
            const line2 = enquiryDraft?.address?.addressLine2;
            if (!line2 || line2 === undefined || line2 === null) {
                if( enquiryDraft.address ) {
                    enquiryDraft.address.addressLine2 = "";
                }
                await enquiryDraft.save();
            }
        }
        return formatResponse(res, 200, "Address line 2 saved successfully", true, {});
    } catch (error) {
        return formatResponse(res, 500, "Error in saving address line 2", false, {});
    }
}
)