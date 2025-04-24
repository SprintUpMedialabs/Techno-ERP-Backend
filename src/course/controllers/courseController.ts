import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response, Request } from "express";
import { courseSchema, courseUpdateSchema, ICourseSchema, ICourseUpdateSchema } from "../validators/courseSchema";
import createHttpError from "http-errors";
import { getAcaYrFromStartYrSemNum } from "../utils/getAcaYrFromStartYrSemNum";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";
import mongoose from "mongoose";
import { fetchCourseIdFromSYCC } from "../helpers/fetchCourseId";

export const createCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const courseData: ICourseSchema = req.body;
    const validation = courseSchema.safeParse(courseData);

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const semester = Array.from({ length: courseData.totalSemesters }, (_, index) => ({
        semesterNumber: index + 1,
        academicYear: getAcaYrFromStartYrSemNum(courseData.startingYear, index),
        subjects: [],
    }));

    await Course.create({
        ...courseData,
        semester: semester
    });

    // const courseInformation = await getCourseInformation("", getCurrentAcademicYear());

    return formatResponse(res, 201, 'Course created successfully', true, null);
});


export const updateCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updateCourseData: ICourseUpdateSchema = req.body;

    const validation = courseUpdateSchema.safeParse(updateCourseData);

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    let { courseId, courseName, courseCode, collegeName, departmentMetaDataId } = validation.data;


    courseId = new mongoose.Types.ObjectId(courseId);
    departmentMetaDataId = new mongoose.Types.ObjectId(departmentMetaDataId);

    const updateResult = await Course.updateOne(
        { _id: courseId },
        {
            $set: {
                courseName,
                courseCode,
                collegeName,
                departmentMetaDataId: departmentMetaDataId,
            },
        }
    );

    if (updateResult.modifiedCount === 0) {
        throw createHttpError(404, 'Course not found or no changes made');
    }

    // const responsePayload = getCourseInformation("", getCurrentAcademicYear());

    return formatResponse(res, 200, 'Course updated successfully', true, null);
})


export const searchCourses = expressAsyncHandler(async (req: Request, res: Response) => {
    let { search, academicYear, page, limit } = req.body;

    let courseInformation = await getCourseInformation(search, academicYear, page, limit);

    return formatResponse(res, 200, 'Courses fetched successfully', true, courseInformation);
});


export const getCourseInformation = async (search: string, academicYear: string, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const pipeline = [
        {
            $match: {
                $or: [
                    { courseName: { $regex: search || "", $options: "i" } },
                    { courseCode: { $regex: search || "", $options: "i" } },
                ],
            },
        },
        {
            $unwind: "$semester",
        },
        {
            $match: {
                "semester.academicYear": academicYear,
            },
        },
        {
            $lookup: {
                from: "departmentmetadatas",
                localField: "departmentMetaDataId",
                foreignField: "_id",
                as: "departmentMetaData",
            },
        },
        { $unwind: "$departmentMetaData" },
        {
            $facet: {
                paginatedResults: [
                    {
                        $project: {
                            _id: 0,
                            courseId: "$_id",
                            courseName: 1,
                            courseCode: 1,
                            semesterId: "$semester._id",
                            semesterNumber: "$semester.semesterNumber",
                            courseYear: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 1] }, then: "First" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 2] }, then: "Second" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 3] }, then: "Third" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 4] }, then: "Fourth" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 5] }, then: "Fifth" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 6] }, then: "Sixth" },
                                    ],
                                    default: "Unknown"
                                }
                            },
                            academicYear: "$semester.academicYear",
                            departmentName: "$departmentMetaData.departmentName",
                            departmentHOD: "$departmentMetaData.departmentHOD",
                            numberOfSubjects: { $size: "$semester.subjects" },
                        }
                    },
                    { $skip: skip },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ];

    const result = await Course.aggregate(pipeline);

    const courseInformation = result[0]?.paginatedResults || [];
    const totalItems = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        courseInformation,
        pagination: {
            currentPage: page,
            totalItems,
            totalPages,
        }
    }
}


export const fetchAllUniqueCourses = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const currentYear = new Date().getFullYear();

    const pipeline = [
        {
            $addFields: {
                courseEndYear: {
                    $add: [
                        "$startingYear",
                        { $divide: ["$totalSemesters", 2] }
                    ]
                }
            }
        },
        {
            $match: {
                courseEndYear: { $gt: currentYear }
            }
        },
        {
            $group: {
                _id: {
                    courseCode: "$courseCode",
                    courseName: "$courseName"
                }
            }
        },
        {
            $project: {
                _id: 0,
                courseCode: "$_id.courseCode",
                courseName: "$_id.courseName"
            }
        }
    ];

    const courses = await Course.aggregate(pipeline);

    return formatResponse(res, 200, 'Unique Courses fetched successfully', true, courses);
});


export const fetchCourseId = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode, startingYear } = req.body;
    
    const course = await fetchCourseIdFromSYCC(courseCode, startingYear);
  
    if (!course) {
      return formatResponse(res, 404, 'Course not found', false);
    }
  
    return formatResponse(res, 200, 'Course ID fetched successfully', true, course);
});