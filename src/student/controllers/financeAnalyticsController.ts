import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { CourseYears, PipelineName } from "../../config/constants";
import { retryMechanism } from "../../config/retryMechanism";
import { CourseMetaData } from "../../course/models/courseMetadata";
import { convertToDDMMYYYY, convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { formatResponse } from "../../utils/formatResponse";
import { getDatesOfMonth } from "../../utils/getDatesOfMonth";
import { getPastSevenDates } from "../../utils/getPastSevenDates";
import { getPreviousDayDateTime } from "../../utils/previousDayDateTime";
import { CollegeTransaction } from "../models/collegeTransactionHistory";
import { CourseWiseDetails, CourseWiseInformation, FinanceAnalytics } from "../models/financeAnalytics";
import { Student } from "../models/student";
import { createPipeline } from "../../pipline/controller";
import moment from "moment-timezone";

export const createFinanceAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const courseYears = ['', CourseYears.First, CourseYears.Second, CourseYears.Third, CourseYears.Fourth];

  const date = moment().tz('Asia/Kolkata').startOf('day').subtract(1, 'day').toDate();

  const academicYear =
    currentMonth >= 6
      ? `${currentYear}-${currentYear + 1}`
      : `${currentYear - 1}-${currentYear}`;

  const courseList = await CourseMetaData.find(
    {},
    { courseCode: 1, courseName: 1, courseDuration: 1, departmentMetaDataId: 1, collegeName: 1 }
  ).populate({
    path: 'departmentMetaDataId',
    select: 'departmentName departmentHODId',
    populate: {
      path: 'departmentHODId',
      select: 'firstName lastName email'
    }
  });

  const financeAnalyticsDetails: FinanceAnalytics = {
    date,
    academicYear,
    totalExpectedRevenue: 0,
    totalCollection: 0,
    courseWise: []
  };

  let totalExpectedRevenueGlobal = 0;
  let totalCollectionGlobal = 0;

  const pipelineId = await createPipeline(PipelineName.FINANCE_ANALYTICS);
  if (!pipelineId) throw createHttpError(400, "Pipeline creation failed");

  await retryMechanism(async (session) => {
    for (const course of courseList) {
      const { courseCode, courseDuration } = course;

      const departmentName = course.departmentName;

      let totalExpectedRevenueCourseWise = 0;
      let totalCollectionCourseWise = 0;

      const courseWise: CourseWiseInformation = {
        courseCode,
        departmentName,
        totalCollection: 0,
        totalExpectedRevenue: 0,
        details: []
      };

      for (let i = 1; i <= courseDuration; i++) {
        const courseYear = courseYears[i];
        const semNumbers = [i * 2 - 1, i * 2];

        const courseYearDetail: CourseWiseDetails = {
          courseYear,
          totalCollection: 0,
          totalExpectedRevenue: 0,
          totalStudents: 0
        };

        const revenueResult = await Student.aggregate([
          {
            $match: {
              courseCode,
              currentAcademicYear: academicYear,
              currentSemester: { $in: semNumbers },
            }
          },
          {
            $project: {
              semesters: {
                $filter: {
                  input: "$semester",
                  as: "sem",
                  cond: { $in: ["$$sem.semesterNumber", semNumbers] }
                }
              }
            }
          },
          { $unwind: "$semesters" },
          {
            $group: {
              _id: null,
              totalFinalFeeSum: { $sum: "$semesters.fees.totalFinalFee" }
            }
          }
        ]).session(session);

        const totalExpectedRevenueCourseYearWise = revenueResult[0]?.totalFinalFeeSum || 0;

        const yesterday = getPreviousDayDateTime();
        const collectionResult = await CollegeTransaction.aggregate([
          {
            $match: {
              courseCode,
              courseYear,
              dateTime: {
                $gte: yesterday.startOfYesterday,
                $lte: yesterday.endOfYesterday
              }
            }
          },
          {
            $group: {
              _id: null,
              totalCollection: { $sum: "$amount" }
            }
          }
        ]).session(session);

        const totalCollectionCourseYearWise = collectionResult[0]?.totalCollection ?? 0;

        courseYearDetail.totalCollection = totalCollectionCourseYearWise;
        courseYearDetail.totalExpectedRevenue = totalExpectedRevenueCourseYearWise;
        courseYearDetail.totalStudents = await Student.countDocuments({
          courseCode,
          currentAcademicYear: academicYear,
          currentSemester: { $in: semNumbers }
        }).session(session);

        totalCollectionCourseWise += totalCollectionCourseYearWise;
        totalExpectedRevenueCourseWise += totalExpectedRevenueCourseYearWise;

        courseWise.details.push(courseYearDetail);
      }

      courseWise.totalCollection = totalCollectionCourseWise;
      courseWise.totalExpectedRevenue = totalExpectedRevenueCourseWise;

      financeAnalyticsDetails.courseWise.push(courseWise);

      totalCollectionGlobal += totalCollectionCourseWise;
      totalExpectedRevenueGlobal += totalExpectedRevenueCourseWise;
    }
  }, 'Finance Analytics Pipeline Failure', "All retry limits expired for the finance analytics creation", pipelineId, PipelineName.FINANCE_ANALYTICS);

  financeAnalyticsDetails.totalCollection = totalCollectionGlobal;
  financeAnalyticsDetails.totalExpectedRevenue = totalExpectedRevenueGlobal;

  console.log(JSON.stringify(financeAnalyticsDetails, null, 2));

  await FinanceAnalytics.create(financeAnalyticsDetails);

  return formatResponse(res, 201, "Finance Analytics created successfully!", true, null);
});


export const fetchDayWiseAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { date } = req.body;

  if (!date)
    throw createHttpError("Please enter the date to fetch analytics!");

  const analyticsForDate = await FinanceAnalytics.findOne({
    date: convertToMongoDate(date),
  });

  const pastDates = getPastSevenDates(date);

  const pastSevenDocs = await FinanceAnalytics.find({
    date: { $in: pastDates },
  }).sort({ date: 1 });

  const pastSevenDayDocs: { date: string; dailyCollection: number; }[] = [];
  pastSevenDocs.forEach(daywiseDoc => {
    pastSevenDayDocs.push({
      date: convertToDDMMYYYY(daywiseDoc.date),
      dailyCollection: daywiseDoc.totalCollection
    })
  });

  const courseWiseData = analyticsForDate?.courseWise || [];

  const courseWiseInformation: {
    courseCode: string,
    details: { courseYear: CourseYears; totalCollection: number }[]
  }[] = [];

  courseWiseData.forEach((courseWise: { details: any; courseCode: any; }) => {
    const detailsArray = courseWise.details.map((det: { courseYear: CourseYears; totalCollection: number }) => ({
      courseYear: det.courseYear,
      totalCollection: det.totalCollection
    }));

    courseWiseInformation.push({
      courseCode: courseWise.courseCode,
      details: detailsArray
    });
  });

  return formatResponse(res, 200, "Fetch day wise trend information successfully", true, {
    totalCollection: analyticsForDate?.totalCollection || 0,
    pastSevenDays: pastSevenDayDocs,
    courseWiseInformation: courseWiseInformation
  });

})


export const fetchMonthWiseAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { monthNumber } = req.body;

  const datesOfMonth = getDatesOfMonth(monthNumber);

  let data = await FinanceAnalytics.find({
    date: { $in: datesOfMonth },
  }).sort({ date: 1 });

  let totalCollection = 0;

  const monthWiseData: { date: string; totalCollection: number; }[] = [];
  const courseWiseObj: Record<string, Record<string, number>> = {};

  data.forEach((record) => {
    totalCollection += record.totalCollection;
    monthWiseData.push({
      date: convertToDDMMYYYY(record.date),
      totalCollection: record.totalCollection
    });

    record.courseWise.forEach((course) => {
      const courseCode = course.courseCode;
      if (!courseWiseObj[courseCode]) {
        courseWiseObj[courseCode] = {};
      }
      course.details.forEach((detail) => {
        const year = detail.courseYear;
        courseWiseObj[courseCode][year] = (courseWiseObj[courseCode][year] || 0) + detail.totalCollection;
      });
    });
  });

  const courseWiseCollection = Object.entries(courseWiseObj).map(([courseCode, yearObj]) => ({
    courseCode,
    details: Object.entries(yearObj).map(([courseYear, totalCollection]) => ({
      courseYear,
      totalCollection
    }))
  }));

  return formatResponse(res, 200, "Monthwise analytics fetched successfully", true, {
    totalCollection: totalCollection,
    monthWiseData: monthWiseData,
    courseWiseCollection: courseWiseCollection
  });

})