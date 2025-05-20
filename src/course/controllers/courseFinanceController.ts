import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { FeeStatus, FormNoPrefixes, PipelineName } from "../../config/constants";
import { retryMechanism } from "../../config/retryMechanism";
import { Student } from "../../student/models/student";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { formatResponse } from "../../utils/formatResponse";
import { CourseDues } from "../models/courseDues";
import { CourseMetaData } from "../models/courseMetadata";
import { createPipeline } from "../../pipline/controller";


export const courseFeeDues = expressAsyncHandler(async (_: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const courseYears = ['', 'FIRST', 'SECOND', 'THIRD', 'FOURTH'];

    const academicYear =
        currentMonth >= 6
            ? `${currentYear}-${currentYear + 1}`
            : `${currentYear - 1}-${currentYear}`;

    const courseList: any = await CourseMetaData.find(
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
    const pipelineId = await createPipeline(PipelineName.COURSE_DUES);
    if (!pipelineId) throw createHttpError(400, "Pipeline creation failed");

    await retryMechanism(async (session) => {

        for (const course of courseList) {
            const { courseCode, courseName, courseDuration, collegeName } = course;
            const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 1));

            const department = course.departmentMetaDataId;
            const hod = department?.departmentHODId;

            const departmentHODName = hod ? `${hod.firstName} ${hod.lastName}` : '';
            const departmentHODEmail = hod?.email;

            const courseDetails: CourseDues = {
                collegeName,
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
    }, 'Course Dues Pipeline Failure', "All retry limits expired for the course dues creation", pipelineId, PipelineName.COURSE_DUES);

    return formatResponse(res, 200, 'course dues recorded successfully', true);
});


export const getCourseDuesByDate = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { date, collegeName } = req.body;

    if (!date || typeof date !== "string") {
        throw createHttpError(400, "Date is required in dd/mm/yyyy format");
    }


    const collegeFilter = (collegeName === "ALL")
        ? { collegeName: { $in: [FormNoPrefixes.TCL, FormNoPrefixes.TIHS, FormNoPrefixes.TIMS] } }
        : { collegeName };


    const targetDate = convertToMongoDate(date);
    console.log(targetDate)

    const dues = await CourseDues.find({ date: targetDate, ...collegeFilter });

    return formatResponse(res, 200, "Course dues fetched", true, dues);
});