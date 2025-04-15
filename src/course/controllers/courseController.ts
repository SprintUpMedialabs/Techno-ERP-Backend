import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response, Request } from "express";
import { courseSchema, ICourseSchema } from "../validators/courseSchema";
import createHttpError from "http-errors";
import { getAcaYrFromStartYrSemNum } from "../utils/getAcaYrFromStartYrSemNum";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";

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

    if (!course)
        throw createHttpError(500, 'Error occurred creating course');

    return formatResponse(res, 201, 'Course created successfully', true, course);
})



export const searchCourses = async (req: Request, res: Response) => {
    let { search, academicYear } = req.body;

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
                courseId: "$_id",
                courseName: 1,
                courseCode: 1,
                semesterId: "$semester._id",
                semesterNumber: "$semester.semesterNumber",
                departmentName: "$departmentMetaData.departmentName",
                departmentHOD: "$departmentMetaDatas.departmentHOD",
                numberOfSubjects: { $size: "$semester.subjects" },
            },
        },
    ];

    const courseInformation = await Course.aggregate(pipeline);

    if(courseInformation.length === 0)
        return formatResponse(res, 200, 'No courses found', true, courseInformation);

    return formatResponse(res, 200, 'Courses fetched successfully', true, courseInformation);
};