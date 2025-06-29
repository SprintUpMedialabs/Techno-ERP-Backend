// clear admission analytics
// from date 1 Jan make a call to assignBaseValueToAdmissionAnalytics
    // year wise only one time
    // month wise for each month
    // date wise for each date

// get all students
// increment admission analytics -> pass course code and date of admission


import expressAsyncHandler from "express-async-handler";
import { formatResponse } from "../../utils/formatResponse";
import { Request, Response } from "express";
import {  incrementAdmissionAnalytics } from "../../admission/controllers/admissionAnalyticsController";
import { AdmissionAggregationType } from "../../config/constants";
import { clearAdmissionAnalytics, spacialAssignBaseValueToAdmissionAnalytics } from "./helper";
import { Student } from "../../student/models/student";

export const redefineAdmissionAnalytics = expressAsyncHandler(async (req: Request, res: Response) => {
  try {

    //clear existing admission analytics
    await clearAdmissionAnalytics();

    const type = [AdmissionAggregationType.YEAR_AND_COURSE_WISE, AdmissionAggregationType.MONTH_WISE, AdmissionAggregationType.DATE_WISE, AdmissionAggregationType.MONTH_AND_COURSE_WISE];

    // Assign base value for each type of admission analytics
    type.forEach(async (aggregationType) => {
      await spacialAssignBaseValueToAdmissionAnalytics({ type: aggregationType });
    });

    // Assign base value to admission analytics to all students
    const students = await Student.find({}).select('studentInfo.dateOfAdmission courseCode');

    //incremant admission analytics for each student
    for (const student of students) {
      if (student.studentInfo.dateOfAdmission && student.courseCode) {
        await incrementAdmissionAnalytics(
          student.courseCode,
          student.studentInfo.dateOfAdmission
        );
      }
    }


    return formatResponse(res, 200, "Admission analytics redefined successfully", true, {});
  } catch (error) {
    formatResponse(res, 500, "Internal Server Error", false, error);
  }
});
