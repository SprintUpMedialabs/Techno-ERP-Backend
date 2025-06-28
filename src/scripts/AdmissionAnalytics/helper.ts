import moment from "moment-timezone";
import { AdmissionAnalyticsModel } from "../../admission/models/admissionAnalytics"
import { AdmissionAggregationType, PipelineName } from "../../config/constants";
import { CourseMetaData } from "../../course/models/courseMetadata";
import createHttpError from "http-errors";
import { createPipeline } from "../../pipline/controller";
import mongoose from "mongoose";
import { retryMechanism } from "../../config/retryMechanism";


export const clearAdmissionAnalytics = async () => {
  try {
    const admissionAnalytics = await AdmissionAnalyticsModel.find({});
    if (admissionAnalytics.length > 0) {
      await AdmissionAnalyticsModel.deleteMany({});
      console.log("Admission analytics cleared successfully.");
    }
    else {
      console.log("No admission analytics found to clear.");
    }
    return true;
  } catch (error) {
    console.error("Error clearing admission analytics:", error);
    return false;
  }
}

export const spacialAssignBaseValueToAdmissionAnalytics = async ({type } : {
  type: AdmissionAggregationType;
}) => {
    const courseList = await CourseMetaData.find().select('courseName');
    const courseNameList = courseList.map(course => ({ courseName: course.courseName }));
    const now = moment().tz('Asia/Kolkata');
    const currentYear = now.year();
    
    if (!Object.values(AdmissionAggregationType).includes(type as AdmissionAggregationType)) {
        throw createHttpError(400, 'Invalid type');
    }
    
    const pipelineId = await createPipeline(PipelineName.ADMISSION_ANALYTICS_BASE_VALUE_ASSIGNMENT);
    if (!pipelineId) throw createHttpError(400, "Pipeline creation failed");

    const session = await mongoose.startSession();
    session.startTransaction();

    await retryMechanism(async (session) => {
        if (type === AdmissionAggregationType.DATE_WISE) {
            // Create entries for all dates in current year (1-Jan to 31-Dec)
            const startDate = moment().tz('Asia/Kolkata').startOf('year');
            const endDate = moment().tz('Asia/Kolkata').endOf('year');
            
            const dateEntries = [];
            let currentDate = startDate.clone();
            
            while (currentDate.isSameOrBefore(endDate, 'day')) {
                dateEntries.push({
                    type,
                    date: currentDate.toDate(),
                    courseName: 'ALL',
                    count: 0,
                });
                currentDate.add(1, 'day');
            }
            
            await AdmissionAnalyticsModel.insertMany(dateEntries, { session });
            
        } else if (type === AdmissionAggregationType.MONTH_WISE) {
            // Create entries for all months (1-12) of current year
            const monthEntries = [];
            
            for (let month = 0; month < 12; month++) {
                monthEntries.push({
                    type,
                    date: moment().tz('Asia/Kolkata').year(currentYear).month(month).startOf('month').toDate(),
                    courseName: 'ALL',
                    count: 0,
                });
            }
            
            await AdmissionAnalyticsModel.insertMany(monthEntries, { session });
            
        } else if (type === AdmissionAggregationType.MONTH_AND_COURSE_WISE) {
            // Create entries for all months (1-12) for each course
            const monthCourseEntries = [];
            
            for (const course of courseNameList) {
                for (let month = 0; month < 12; month++) {
                    monthCourseEntries.push({
                        type,
                        date: moment().tz('Asia/Kolkata').year(currentYear).month(month).startOf('month').toDate(),
                        courseName: course.courseName,
                        count: 0,
                    });
                }
            }
            
            await AdmissionAnalyticsModel.insertMany(monthCourseEntries, { session });
            
        } else if (type === AdmissionAggregationType.YEAR_AND_COURSE_WISE) {
            // Create entries for current year for each course
            const yearCourseEntries = courseNameList.map(course => ({
                type,
                date: moment().tz('Asia/Kolkata').year(currentYear).startOf('year').toDate(),
                courseName: course.courseName,
                count: 0,
            }));
            
            await AdmissionAnalyticsModel.insertMany(yearCourseEntries, { session });
        }
    }, `Base value assignment failed`, `Base value assignment failed for type ${type}`, pipelineId, PipelineName.ADMISSION_ANALYTICS_BASE_VALUE_ASSIGNMENT, 5, 500);

    await session.commitTransaction();
    session.endSession();

    return true;
};
