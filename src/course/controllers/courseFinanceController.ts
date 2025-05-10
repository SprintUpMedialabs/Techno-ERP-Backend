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


export const courseFeeDues = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const courseYears = ['', 'FIRST', 'SECOND', 'THIRD', 'FOURTH'];

    const academicYear =
        currentMonth >= 6
            ? `${currentYear}-${currentYear + 1}`
            : `${currentYear - 1}-${currentYear}`;

            // DTODO: populate hod info here only
    const courseList = await CourseMetaData.find({}, { courseCode: 1, courseName: 1, courseDuration: 1 });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        for (const course of courseList) {
            const { courseCode, courseName, courseDuration } = course;
            const today = new Date();
            console.log(today.getFullYear(), today.getMonth(), today.getDate());
            const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
            console.log(date)
            const courseDetails: CourseDues = { courseCode, courseName, academicYear, dues: [], date };

            for (let i = 1; i <= courseDuration; i++) {
                const courseYear = courseYears[i];
                const semNumbers = [i* 2 - 1, i * 2];

                const resultArray = await Student.aggregate([
                    {
                        $match: {
                            courseCode,
                            currentAcademicYear: academicYear,
                            currentSemester: { $in: semNumbers }
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
                                                        // DTODO: fee ststus check
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
                ]);

                const { totalDue = 0, dueStudentCount = 0 } = resultArray[0] ?? {};
                courseDetails.dues.push({ courseYear, totalDue, dueStudentCount });
            }

            await CourseDues.create([courseDetails], { session });
        }
        await session.commitTransaction();
        session.endSession();
    } catch (error: any) {
        logger.error(error);
        await session?.abortTransaction();
        session?.endSession();
        throw createHttpError(500, error);
    }

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