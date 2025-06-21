import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { formatResponse } from "../../utils/formatResponse";
import { Student } from "../../student/models/student";

export const getAbsentStudents = expressAsyncHandler(async(req: Request, res: Response) => {
    try {
        const {mobileNumbers} = req.body;
        const students = await Student.find({"studentInfo.studentPhoneNumber": {$nin: mobileNumbers}});
        let absentArray:string[] = [];
        students.forEach((student) => {
            if(student.studentInfo.studentPhoneNumber){
                absentArray.push(student.studentInfo.studentPhoneNumber);
            }
        })
        return formatResponse(res, 200, "Absent students fetched successfully", true, {absentArray});
    } catch (error) {
        console.log(error);
        return formatResponse(res, 500, "Error in fetching absent students", false, {});
    }
})