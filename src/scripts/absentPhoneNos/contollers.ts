import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { formatResponse } from "../../utils/formatResponse";
import { Student } from "../../student/models/student";

export const getAbsentStudents = expressAsyncHandler(async(req: Request, res: Response) => {
    try {
        const {mobileNumbers} = req.body();
        const students = await Student.find({});
        let absentArray:string[] = [];

        mobileNumbers.forEach((mobileNo:string) => {
            if(!students.find((student) => student.studentInfo.studentPhoneNumber)){
                absentArray.push(mobileNo)
            }
        })
        return formatResponse(res, 200, "Address line 2 saved successfully", true, {absentArray});
    } catch (error) {
        return formatResponse(res, 500, "Error in saving address line 2", false, {});
    }
})