import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { CourseMetaData } from "../models/courseMetadata";
import { Response } from "express";
import { Student } from "../../student/models/student";
import { CourseDues } from "../models/courseDues";
import { formatResponse } from "../../utils/formatResponse";
import mongoose from "mongoose";
import logger from "../../config/logger";
import createHttpError from "http-errors";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { FeeStatus } from "../../config/constants";
import { getHODInformationUsingDepartmentID } from "./departmentMetaDataController";
import { retryMechanism } from "../../config/retryMechanism";


export const courseFeeDues = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const courseYears = ['', 'FIRST', 'SECOND', 'THIRD', 'FOURTH'];

    const academicYear =
        currentMonth >= 6
            ? `${currentYear}-${currentYear + 1}`
            : `${currentYear - 1}-${currentYear}`;

    const courseList = await CourseMetaData.find({}, { courseCode: 1, courseName: 1, courseDuration: 1, departmentMetaDataId : 1 });


    // let testCounter = 0; 

    await retryMechanism(async (session) => {

        // testCounter++;
        // if (testCounter <= 5) {
        //     console.log("Test counter : ", testCounter);
        //     throw createHttpError(400, "Failure occurred in course pipeline, contact developer");
        // }

        for (const course of courseList) {
            const { courseCode, courseName, courseDuration, departmentMetaDataId } = course;
            const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

            const { departmentHODName, departmentHODEmail } =
                await getHODInformationUsingDepartmentID(departmentMetaDataId.toString());

            const courseDetails: CourseDues = {
                courseCode,
                courseName,
                academicYear,
                dues: [],
                date,
                departmentHODName,
                departmentHODEmail
            };

            for (let i = 1; i <= courseDuration; i++) {
                const courseYear = courseYears[i];
                const semNumbers = [i * 2 - 1, i * 2];

                const resultArray = await Student.aggregate([
                    {
                        $match: {
                            courseCode,
                            currentAcademicYear: academicYear,
                            currentSemester: { $in: semNumbers },
                            feeStatus: { $ne: FeeStatus.PAID }
                        }
                    },
                    {
                        $project: {
                            totalDueAmount: {
                                $sum: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$semester',
                                                as: 'sem',
                                                cond: {
                                                    $and: [
                                                        { $ne: ['$$sem.fees.dueDate', null] },
                                                        { $ifNull: ['$$sem.fees.dueDate', false] }
                                                    ]
                                                }
                                            }
                                        },
                                        as: 'filteredSem',
                                        in: {
                                            $subtract: [
                                                '$$filteredSem.fees.totalFinalFee',
                                                '$$filteredSem.fees.paidAmount'
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalDue: { $sum: '$totalDueAmount' },
                            dueStudentCount: { $sum: 1 }
                        }
                    }
                ]).session(session);

                const { totalDue = 0, dueStudentCount = 0 } = resultArray[0] ?? {};
                courseDetails.dues.push({ courseYear, totalDue, dueStudentCount });
            }

            await CourseDues.create([courseDetails], { session });
        }
    }, 'Course Dues Pipeline Failure', "All retry limits expired for the course dues creation");

    return formatResponse(res, 200, 'course dues recorded successfully', true);
});


export const getCourseDuesByDate = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { date } = req.query;

    if (!date || typeof date !== "string") {
        throw createHttpError(400,"Date is required in dd/mm/yyyy format");
    }

    const targetDate = convertToMongoDate(date);
    console.log(targetDate)

    const dues = await CourseDues.find({ date: targetDate });

    return formatResponse(res, 200, "Course dues fetched", true, dues);
});