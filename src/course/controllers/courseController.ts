import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response, Request } from "express";
import { courseSchema, courseUpdateSchema, ICourseSchema, ICourseUpdateSchema } from "../validators/courseSchema";
import createHttpError from "http-errors";
import { getAcaYrFromStartYrSemNum } from "../utils/getAcaYrFromStartYrSemNum";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";
import { getCurrentAcademicYear } from "../utils/getCurrentAcademicYear";
import mongoose from "mongoose";

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

    const course = await Course.create({
        ...courseData,
        semester: semester
    });

    console.log("Course is : ", course);
    if (!course)
        throw createHttpError(500, 'Error occurred creating course');

    const courseInformation = await getCourseInformation("", getCurrentAcademicYear());

    return formatResponse(res, 201, 'Course created successfully', true, courseInformation);
});


export const updateCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updateCourseData: ICourseUpdateSchema = req.body;

    const validation = courseUpdateSchema.safeParse(updateCourseData);

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    let { courseId, courseName, courseCode, collegeName, departmentMetaDataId } = updateCourseData;


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

    // const updatedCourseData = await Course.aggregate([
    //     {
    //         $match: { _id: courseId }
    //     },
    //     {
    //         $lookup: {
    //             from: "departmentmetadatas",
    //             localField: "departmentMetaDataId",
    //             foreignField: "_id",
    //             as: "departmentMetaData"
    //         }
    //     },
    //     { $unwind: "$departmentMetaData" },
    //     {
    //         $unwind: {
    //             path: "$semester",
    //             preserveNullAndEmptyArrays: true
    //         }
    //     },
    //     {
    //         $project: {
    //             courseId: "$_id",
    //             courseName: 1,
    //             courseCode: 1,
    //             collegeName: 1,
    //             semesterId: "$semester._id",
    //             semesterNumber: "$semester.semesterNumber",
    //             departmentName: "$departmentMetaData.departmentName",
    //             departmentHOD: "$departmentMetaData.departmentHOD",
    //             courseYear: {
    //                 $switch: {
    //                   branches: [
    //                     { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 1] }, then: "First" },
    //                     { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 2] }, then: "Second" },
    //                     { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 3] }, then: "Third" },
    //                     { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 4] }, then: "Fourth" },
    //                     { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 5] }, then: "Fifth" },
    //                     { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 6] }, then: "Sixth" },
    //                   ],
    //                   default: "Unknown"
    //                 }
    //             },
    //             academicYear: "$semester.academicYear",
    //             numberOfSubjects: {
    //                 $cond: {
    //                     if: { $isArray: "$semester.subjects" },
    //                     then: { $size: "$semester.subjects" },
    //                     else: 0
    //                 }
    //             }
    //         }
    //     }
    // ]);

    const responsePayload = getCourseInformation("", getCurrentAcademicYear());

    return formatResponse(res, 200, 'Course updated successfully', true, responsePayload);
})


export const searchCourses = expressAsyncHandler(async (req: Request, res: Response) => {
    let { search, academicYear } = req.body;

    let courseInformation = await getCourseInformation(search, academicYear);

    if (courseInformation.length === 0)
        return formatResponse(res, 200, 'No courses found', true, courseInformation);

    return formatResponse(res, 200, 'Courses fetched successfully', true, courseInformation);
});


export const getCourseInformation = async (search: string, academicYear: string) => {
    console.log(search);
    console.log(academicYear);
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
            $project: {
                _id : 0,
                courseId: "$_id",
                courseName: 1,
                courseCode: 1,
                semesterId: "$semester._id",
                semesterNumber: "$semester.semesterNumber",
                // courseYear :   `${getCourseYrFromSemNum(parseInt("$semester.semesterNumber"))}`,
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
            },
        },
    ];

    const courseInformation = await Course.aggregate(pipeline);
    return courseInformation;
}