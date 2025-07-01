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
import mongoose from "mongoose";

export const createFinanceAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const dateMoment = moment().tz('Asia/Kolkata').startOf('day');
  const date = dateMoment.toDate();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();

  const courseYears = ['Zero', CourseYears.First, CourseYears.Second, CourseYears.Third, CourseYears.Fourth];

  const academicYear =
    currentMonth >= 6
      ? `${currentYear}-${currentYear + 1}`
      : `${currentYear - 1}-${currentYear}`;
  const newAdmissionAcademicYear = currentMonth >= 6 ? `${currentYear + 1}-${currentYear + 2}` : `${currentYear}-${currentYear + 1}`;

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
    totalStudents: 0,
    courseWise: []
  };

  let totalExpectedRevenueGlobal = 0;
  let totalCollectionGlobal = 0;
  let totalStudentsGlobal = 0;

  const pipelineId = await createPipeline(PipelineName.FINANCE_ANALYTICS);
  if (!pipelineId) throw createHttpError(400, "Pipeline creation failed");

  const session = await mongoose.startSession();
  session.startTransaction();

  await retryMechanism(async (session) => {
    for (const course of courseList) {
      const { courseName, courseDuration, courseCode } = course;

      const departmentName = course.departmentName;

      let totalExpectedRevenueCourseWise = 0;
      let totalCollectionCourseWise = 0;
      let totalStudentsCourseWise = 0;

      const courseWise: CourseWiseInformation = {
        courseName,
        departmentName,
        totalCollection: 0,
        totalExpectedRevenue: 0,
        totalStudents: 0,
        details: []
      };

      for (let i = 0; i <= courseDuration; i++) {
        const courseYear = courseYears[i];
        const semNumbers = i == 0 ? [1] : [i * 2 - 1, i * 2];
        let useAcademicYear = i == 0 ? newAdmissionAcademicYear : academicYear;

        const courseYearDetail: CourseWiseDetails = {
          courseYear: courseYear,
          totalCollection: 0,
          totalExpectedRevenue: 0,
          totalStudents: 0
        };

        // TODO: pass out student handling
        //       remaining dues
        //       prevTotalDueAtSemStart => create cron job for this        

        const revenueResult = await Student.aggregate([
          {
            $match: {
              courseCode,
              currentAcademicYear: useAcademicYear,
              currentSemester: { $in: semNumbers },
            }
          },
          {
            $project: {
              totalFinalFee: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$semester',
                        as: 'sem',
                        cond: {
                          $and: [
                            { $ne: ['$$sem.fees.dueDate', null] },
                            { $ifNull: ['$$sem.fees.dueDate', false] },
                            { $eq: ['$$sem.semesterNumber', '$$ROOT.currentSemester'] }
                          ]
                        }
                      }
                    },
                    as: 'filteredSem',
                    in: '$$filteredSem.fees.totalFinalFee'
                  }
                }
              },
              prevTotalDueAtSemStart: 1
            }
          },
          {
            $project: {
              totalDueWithPrev: {
                $add: ['$totalFinalFee', '$prevTotalDueAtSemStart']
              }
            }
          },
          {
            $match: { totalDueWithPrev: { $gt: 0 } }
          },
          {
            $group: {
              _id: null,
              totalDueSum: { $sum: '$totalDueWithPrev' }
            }
          }
        ]).session(session);

        const totalExpectedRevenueCourseYearWise = revenueResult[0]?.totalDueSum || 0;

        let collectionResult: any[] = [];
        if (courseYear == "Zero") {
          collectionResult = [];
        } else {
          collectionResult = await CollegeTransaction.aggregate([
            {
              $match: {
                courseCode,
                courseYear: courseYear == 'Zero' ? 'First' : courseYear,
                dateTime: {
                  $gte: dateMoment.startOf('day').toDate(),
                  $lte: dateMoment.endOf('day').toDate()
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
        }
        const totalCollectionCourseYearWise = collectionResult[0]?.totalCollection ?? 0;

        courseYearDetail.totalCollection = totalCollectionCourseYearWise;
        courseYearDetail.totalExpectedRevenue = totalExpectedRevenueCourseYearWise;
        courseYearDetail.totalStudents = await Student.countDocuments({
          courseCode,
          currentAcademicYear: useAcademicYear,
          currentSemester: { $in: semNumbers }
        }).session(session);

        totalCollectionCourseWise += totalCollectionCourseYearWise;
        totalExpectedRevenueCourseWise += totalExpectedRevenueCourseYearWise;
        totalStudentsCourseWise += courseYearDetail.totalStudents;

        courseWise.details.push(courseYearDetail);
      }

      courseWise.totalCollection = totalCollectionCourseWise;
      courseWise.totalExpectedRevenue = totalExpectedRevenueCourseWise;
      courseWise.totalStudents = totalStudentsCourseWise;

      financeAnalyticsDetails.courseWise.push(courseWise);

      totalCollectionGlobal += totalCollectionCourseWise;
      totalExpectedRevenueGlobal += totalExpectedRevenueCourseWise;
      totalStudentsGlobal += totalStudentsCourseWise;
    }
    financeAnalyticsDetails.totalCollection = totalCollectionGlobal;
    financeAnalyticsDetails.totalExpectedRevenue = totalExpectedRevenueGlobal;
    financeAnalyticsDetails.totalStudents = totalStudentsGlobal;
    await FinanceAnalytics.create([financeAnalyticsDetails], { session });
  }, 'Finance Analytics Pipeline Failure', "All retry limits expired for the finance analytics creation", pipelineId, PipelineName.FINANCE_ANALYTICS);

  return formatResponse(res, 201, "Finance Analytics created successfully!", true, null);
});

export const createFinanceAnalyticsBackupForPreviousDays = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // const today = new Date();
  // const currentYear = today.getFullYear();
  // const currentMonth = today.getMonth();

  // const date = moment().tz('Asia/Kolkata').startOf('day').toDate();

  const startOfYear = moment().year(2025).startOf('year'); // Jan 1, 2025
  const today = moment();

  while (startOfYear.isSameOrBefore(today, 'day')) {
    const today = startOfYear.toDate();
    console.log(today);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const date = today;
    const courseYears = ['Zero', CourseYears.First, CourseYears.Second, CourseYears.Third, CourseYears.Fourth];

    const academicYear =
      currentMonth >= 6
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`;
    const newAdmissionAcademicYear = currentMonth >= 6 ? `${currentYear + 1}-${currentYear + 2}` : `${currentYear}-${currentYear + 1}`;

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
      totalStudents: 0,
      courseWise: []
    };

    let totalExpectedRevenueGlobal = 0;
    let totalCollectionGlobal = 0;
    let totalStudentsGlobal = 0;

    const pipelineId = await createPipeline(PipelineName.FINANCE_ANALYTICS);
    if (!pipelineId) throw createHttpError(400, "Pipeline creation failed");

    const session = await mongoose.startSession();
    session.startTransaction();

    await retryMechanism(async (session) => {
      for (const course of courseList) {
        const { courseName, courseDuration, courseCode } = course;

        const departmentName = course.departmentName;

        let totalExpectedRevenueCourseWise = 0;
        let totalCollectionCourseWise = 0;
        let totalStudentsCourseWise = 0;

        const courseWise: CourseWiseInformation = {
          courseName,
          departmentName,
          totalCollection: 0,
          totalExpectedRevenue: 0,
          totalStudents: 0,
          details: []
        };

        for (let i = 0; i <= courseDuration; i++) {
          const courseYear = courseYears[i];
          const semNumbers = i == 0 ? [1] : [i * 2 - 1, i * 2];
          let useAcademicYear = i == 0 ? newAdmissionAcademicYear : academicYear;

          const courseYearDetail: CourseWiseDetails = {
            courseYear: courseYear,
            totalCollection: 0,
            totalExpectedRevenue: 0,
            totalStudents: 0
          };

          // TODO: pass out student handling
          //       remaining dues
          //       prevTotalDueAtSemStart => create cron job for this        

          const revenueResult = await Student.aggregate([
            {
              $match: {
                courseCode,
                currentAcademicYear: useAcademicYear,
                dateOfAdmission: { $lte: today },
                currentSemester: { $in: semNumbers },
              }
            },
            {
              $project: {
                totalFinalFee: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$semester',
                          as: 'sem',
                          cond: {
                            $and: [
                              { $ne: ['$$sem.fees.dueDate', null] },
                              { $ifNull: ['$$sem.fees.dueDate', false] },
                              { $eq: ['$$sem.semesterNumber', '$$ROOT.currentSemester'] }
                            ]
                          }
                        }
                      },
                      as: 'filteredSem',
                      in: '$$filteredSem.fees.totalFinalFee'
                    }
                  }
                },
                prevTotalDueAtSemStart: 1
              }
            },
            {
              $project: {
                totalDueWithPrev: {
                  $add: ['$totalFinalFee', '$prevTotalDueAtSemStart']
                }
              }
            },
            {
              $match: { totalDueWithPrev: { $gt: 0 } }
            },
            {
              $group: {
                _id: null,
                totalDueSum: { $sum: '$totalDueWithPrev' }
              }
            }
          ]).session(session);

          const totalExpectedRevenueCourseYearWise = revenueResult[0]?.totalDueSum || 0;

          // const yesterday = startOfYear.clone().subtract(1, 'day');
          let collectionResult: any[] = [];
          if (courseYear == "Zero") {
            collectionResult = [];
          } else {
            collectionResult = await CollegeTransaction.aggregate([
              {
                $match: {
                  courseCode,
                  courseYear: courseYear == 'Zero' ? 'First' : courseYear,
                  dateTime: {
                    $gte: startOfYear.clone().startOf('day').toDate(),
                    $lte: startOfYear.clone().endOf('day').toDate()
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
          }
          const totalCollectionCourseYearWise = collectionResult[0]?.totalCollection ?? 0;

          courseYearDetail.totalCollection = totalCollectionCourseYearWise;
          courseYearDetail.totalExpectedRevenue = totalExpectedRevenueCourseYearWise;
          courseYearDetail.totalStudents = await Student.countDocuments({
            courseCode,
            currentAcademicYear: useAcademicYear,
            dateOfAdmission: { $lte: today },
            currentSemester: { $in: semNumbers }
          }).session(session);

          totalCollectionCourseWise += totalCollectionCourseYearWise;
          totalExpectedRevenueCourseWise += totalExpectedRevenueCourseYearWise;
          totalStudentsCourseWise += courseYearDetail.totalStudents;

          courseWise.details.push(courseYearDetail);
        }

        courseWise.totalCollection = totalCollectionCourseWise;
        courseWise.totalExpectedRevenue = totalExpectedRevenueCourseWise;
        courseWise.totalStudents = totalStudentsCourseWise;

        financeAnalyticsDetails.courseWise.push(courseWise);

        totalCollectionGlobal += totalCollectionCourseWise;
        totalExpectedRevenueGlobal += totalExpectedRevenueCourseWise;
        totalStudentsGlobal += totalStudentsCourseWise;
      }
      financeAnalyticsDetails.totalCollection = totalCollectionGlobal;
      financeAnalyticsDetails.totalExpectedRevenue = totalExpectedRevenueGlobal;
      financeAnalyticsDetails.totalStudents = totalStudentsGlobal;
      await FinanceAnalytics.create([financeAnalyticsDetails], { session });
    }, 'Finance Analytics Pipeline Failure', "All retry limits expired for the finance analytics creation", pipelineId, PipelineName.FINANCE_ANALYTICS);
    startOfYear.add(1, 'day');
  }
  return formatResponse(res, 201, "Finance Analytics created successfully!", true, null);
});

// TODO: NEW ADDMISSION NEEDS TO BE HANDLE ALSO PASSOUT STUDENT DUES
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

  pastDates.forEach((d) => {
    const mongoDate = convertToMongoDate(d);

    const matchingDoc = pastSevenDocs.find(
      doc => mongoDate && doc.date && mongoDate.toISOString() === doc.date.toISOString()
    );

    pastSevenDayDocs.push({
      date: convertToDDMMYYYY(new Date(d)),
      dailyCollection: matchingDoc ? matchingDoc.totalCollection : 0
    });
  });

  const courseWiseData = analyticsForDate?.courseWise || [];

  const courseWiseInformation: {
    courseName: string,
    totalCollection: number,
    // details: { courseYear: CourseYears; totalCollection: number }[]
  }[] = [];

  courseWiseData.forEach((courseWise: { details: any; courseName: any; }) => {
    const totalCollection = courseWise.details.reduce((acc: number, curr: { courseYear: CourseYears; totalCollection: number }) => acc + curr.totalCollection, 0);

    courseWiseInformation.push({
      courseName: courseWise.courseName,
      totalCollection: totalCollection
    });
  });

  return formatResponse(res, 200, "Fetch day wise trend information successfully", true, {
    totalCollectionForThisDay: analyticsForDate?.totalCollection || 0,
    pastSevenDays: pastSevenDayDocs,
    courseWiseCollectionForThisDay: courseWiseInformation
  });

})


export const fetchMonthWiseAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { monthNumber } = req.body;

  const datesOfMonth = getDatesOfMonth(monthNumber);

  // TODO: missing logic is i will not get data of previous months means left chart is not going to be created from this.

  let data = await FinanceAnalytics.find({
    date: { $in: datesOfMonth },
  }).sort({ date: 1 });

  let totalCollectionForThisMonth = 0;

  // const monthWiseData: { date: string; totalCollection: number; }[] = [];
  const courseWiseObj: Record<string, number> = {};

  data.forEach((record) => {
    totalCollectionForThisMonth += record.totalCollection;
    // monthWiseData.push({
    //   date: convertToDDMMYYYY(record.date),
    //   totalCollection: record.totalCollection
    // });

    record.courseWise.forEach((course) => {
      const courseName = course.courseName;
      if (!courseWiseObj[courseName]) {
        courseWiseObj[courseName] = 0;
      }
      course.details.forEach((detail) => {
        courseWiseObj[courseName] = (courseWiseObj[courseName] || 0) + detail.totalCollection;
      });
    });
  });

  const courseWiseCollectionForThisMonth = Object.entries(courseWiseObj).map(([courseName, totalCollection]) => ({
    courseName,
    totalCollection
  }));


  // MONTH WISE DATA CALCULATION
  const timezone = 'Asia/Kolkata';
  const now = moment.tz(timezone);
  const currentYear = now.year();

  // Build array of {start, end, label} for last 7 months including given monthNumber
  // If month goes below 1, go to previous year

  const months = [];
  let year = currentYear;
  let month = monthNumber; // 1-12

  for (let i = 0; i < 7; i++) {
    if (month < 1) {
      month = 12;
      year--;
    }
    // start and end of month in timezone
    const startDate = moment.tz({ year, month: month - 1, day: 1 }, timezone).startOf('day').toDate();
    const endDate = moment.tz(startDate, timezone).endOf('month').endOf('day').toDate();

    months.push({
      year,
      month,
      startDate,
      endDate,
      label: moment.tz(startDate, timezone).format('MMMM YY') // e.g. May 25
    });

    month--;
  }

  // Get the overall date range for aggregation query
  const earliestStart = months[months.length - 1].startDate;
  const latestEnd = months[0].endDate;

  // Mongo aggregation pipeline
  const aggregation = [
    {
      $match: {
        date: { $gte: earliestStart, $lte: latestEnd }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalCollection: { $sum: '$totalCollection' }
      }
    }
  ];

  const results = await FinanceAnalytics.aggregate(aggregation);

  // Create a map for quick lookup
  const resultMap = new Map<string, number>();
  results.forEach(r => {
    const key = `${r._id.year}-${r._id.month}`;
    resultMap.set(key, r.totalCollection);
  });

  // Build final response array
  const monthWiseData = months.map(m => ({
    date: m.label,
    totalCollection: resultMap.get(`${m.year}-${m.month}`) || 0
  })).reverse(); // reverse so older month comes first

  return formatResponse(res, 200, "Monthwise analytics fetched successfully", true, {
    totalCollectionForThisMonth: totalCollectionForThisMonth,
    monthWiseData: monthWiseData,
    courseWiseCollectionForThisMonth: courseWiseCollectionForThisMonth
  });

})