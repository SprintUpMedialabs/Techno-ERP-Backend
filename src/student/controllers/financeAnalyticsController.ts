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
import { format } from "morgan";

/*
  academicYear : 2024-2025
  course 
*/

export const createFinanceAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const courseYears = ['', CourseYears.First, CourseYears.Second, CourseYears.Third, CourseYears.Fourth];

  //DTODO : Handle edge case here
  const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 1));

  const academicYear =
    currentMonth >= 6
      ? `${currentYear}-${currentYear + 1}`
      : `${currentYear - 1}-${currentYear}`;

  console.log("Academic Year : ", academicYear);

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
              semesterFiltered: {
                $filter: {
                  input: "$semester",
                  as: "sem",
                  cond: {
                    $and: [
                      { $in: ["$$sem.semesterNumber", semNumbers] },
                      { $ne: ["$$sem.dueDate", null] }
                    ]
                  }
                }
              },
              allSemesters: "$semester"
            }
          },
          { $unwind: "$semesterFiltered" },
          {
            $addFields: {
              carryForwardDues: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$allSemesters",
                        as: "prevSem",
                        cond: {
                          $and: [
                            { $lt: ["$$prevSem.semesterNumber", "$semesterFiltered.semesterNumber"] },
                            { $ne: ["$$prevSem.dueDate", null] }
                          ]
                        }
                      }
                    },
                    as: "dueSem",
                    in: {
                      $max: [
                        { $subtract: ["$$dueSem.fees.totalFinalFee", { $ifNull: ["$$dueSem.fees.paidAmount", 0] }] },
                        0
                      ]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              expectedRevenue: {
                $add: [
                  "$semesterFiltered.fees.totalFinalFee",
                  "$carryForwardDues"
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              totalExpectedRevenue: { $sum: "$expectedRevenue" }
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
  if (!date) throw createHttpError("Please enter the date to fetch analytics!");

  const mongoDate = convertToMongoDate(date);
  const [analyticsForDate, pastSevenDocs] = await Promise.all([
    FinanceAnalytics.findOne({ date: mongoDate }),
    FinanceAnalytics.find({ date: { $in: getPastSevenDates(date) } }).sort({ date: 1 })
  ]);

  const pastSevenDayDocs = pastSevenDocs.map(doc => ({
    date: convertToDDMMYYYY(doc.date),
    dailyCollection: doc.totalCollection
  }));

  const courseWiseData = analyticsForDate?.courseWise || [];

  const courseWiseInformation = courseWiseData.map((course: { courseCode: string; details: { courseYear: CourseYears; totalCollection: number }[] }) => {
    const totalCollection = course.details.reduce((sum, det) => sum + det.totalCollection, 0);
    const details = course.details.map(det => ({
      courseYear: det.courseYear,
      totalCollection: det.totalCollection
    }));
    return {
      courseCode: course.courseCode,
      totalCollection,
      details
    };
  });

  return formatResponse(res, 200, "Fetch day wise trend information successfully", true, {
    totalCollection: analyticsForDate?.totalCollection || 0,
    pastSevenDays: pastSevenDayDocs,
    courseWiseInformation
  });
});



export const fetchMonthWiseAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let { monthNumber, year } = req.body;
  const currentDate = new Date();

  if (!monthNumber) {
    monthNumber = currentDate.getMonth() + 1;
  }

  if (!year) {
    year = currentDate.getFullYear();
  }

  const datesOfMonth = getDatesOfMonth(monthNumber, year);

  let data = await FinanceAnalytics.find({
    date: { $in: datesOfMonth },
  }).sort({ date: 1 });

  let totalCollection = 0;

  const monthWiseData: { date: string; totalCollection: number }[] = [];
  const courseWiseObj: Record<string, Record<string, { totalCollection: number }>> = {};

  data.forEach((record) => {
    totalCollection += record.totalCollection;

    monthWiseData.push({
      date: convertToDDMMYYYY(record.date),
      totalCollection: record.totalCollection,
    });

    record.courseWise.forEach((course) => {
      const courseCode = course.courseCode;
      if (!courseWiseObj[courseCode]) {
        courseWiseObj[courseCode] = {};
      }

      course.details.forEach((detail) => {
        const courseYear = detail.courseYear;
        if (!courseWiseObj[courseCode][courseYear]) {
          courseWiseObj[courseCode][courseYear] = {
            totalCollection: 0,
          };
        }

        courseWiseObj[courseCode][courseYear].totalCollection += detail.totalCollection;
      });
    });
  });

  const courseWiseCollection = Object.entries(courseWiseObj).map(([courseCode, yearObj]) => {
    let courseTotalCollection = 0;

    const details = Object.entries(yearObj).map(([courseYear, values]) => {
      courseTotalCollection += values.totalCollection;
      return {
        courseYear,
        totalCollection: values.totalCollection,
      };
    });

    return {
      courseCode,
      totalCollection: courseTotalCollection,
      details,
    };
  });

  return formatResponse(res, 200, "Monthwise analytics fetched successfully", true, {
    totalCollection,
    monthWiseData,
    courseWiseCollection,
  });
});



export const fetchOverallAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { courseCode } = req.body;
  const currentYear = new Date().getFullYear();

  const startOfYear = new Date(currentYear, 0, 1);
  const today = new Date();
  const filterCourse = courseCode && courseCode !== "ALL";
  const pipeline: any[] = [
    {
      $match: {
        date: { $gte: startOfYear, $lte: today }
      }
    },
    { $unwind: "$courseWise" },
    ...(filterCourse ? [{ $match: { "courseWise.courseCode": courseCode } }] : []),
    { $unwind: "$courseWise.details" },
    {
      $group: {
        _id: null,
        totalCollection: { $sum: "$courseWise.details.totalCollection" }
      }
    }
  ];

  const result = await FinanceAnalytics.aggregate(pipeline);
  const totalCollection = result[0]?.totalCollection || 0;

  return formatResponse(res, 200, "Finance Analytics Fetched Successfully", true, {
    totalExpectedRevenue: 0,
    totalCollection
  });
});
