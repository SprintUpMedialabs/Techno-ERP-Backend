import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express"
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { formatResponse } from "../../utils/formatResponse";
import { DepartmentModel } from "../models/department";
import { courseRequestSchema, ICourseRequestSchema, ICourseUpdateSchema, updateCourseSchema } from "../validators/courseSchema";

export const createCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const createCourseData: ICourseRequestSchema = req.body;
    const validation = courseRequestSchema.safeParse(createCourseData);

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const semesterArray = Array.from({ length: createCourseData.totalSemesters }, (_, i) => ({
        semesterNumber: i + 1,
        subjectDetails: []
    }));

    const newCourse = {
        ...validation.data,
        semester: semesterArray
    }

    const existingCourse = await DepartmentModel.findOne({
        _id: validation.data.departmentId,
        "courses.courseCode": validation.data.courseCode
    });

    if (existingCourse) {
        throw createHttpError(400, `Course with code ${validation.data.courseCode} already exists in this department.`);
    }


    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        { _id: createCourseData.departmentId, "courses.courseCode": { $ne: newCourse.courseCode } },
        { $push: { courses: newCourse } },
        { new: true, runValidators: true }
    );

    if (!updatedDepartment) {
        throw createHttpError(400, "Course with this course code already exists.");
    }

    return formatResponse(res, 200, 'Course created successfully', true, updatedDepartment);
});

export const updateCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updateCourseData : ICourseUpdateSchema = req.body;
    const validation = updateCourseSchema.safeParse(updateCourseData);

    if(!validation.success)
        throw createHttpError(400, validation.error.errors[0]);


    const { courseId, courseName, courseCode, collegeName } = validation.data;

    const isDuplicateCourseCode = await DepartmentModel.findOne({
        "courses.courseCode": courseCode,
        "courses._id": { $ne: courseId } 
    });

    if (isDuplicateCourseCode) {
        throw createHttpError(400, `Course with code ${courseCode} already exists in this department.`);
    }

    const updatedCourse = await DepartmentModel.findOneAndUpdate(
        { "courses._id": courseId },
        {
            $set: {
                "courses.$.courseName": courseName,
                "courses.$.courseCode": courseCode,
                "courses.$.collegeName": collegeName
            }
        },
        { new: true, projection: { "courses": { $elemMatch: { _id: courseId } } }, runValidators: true }
    );
    
    return formatResponse(res, 200, 'Course information updated successfully', true, updatedCourse);

})


export const deleteCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { courseId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw createHttpError(404, 'Not a valid course id');
    }

    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        { "courses._id": courseId },
        { $pull: { courses: { _id: courseId } } },
        { new: true }
    );

    return formatResponse(res, 200, "Course deleted successfully", true, updatedDepartment);
});


export const searchCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    
    let { search } = req.body;  
    
    if (!search)
    {
        search = "";
    }
    // Future DTODO: do we change this to just search based on courseCode?
    const matchedCourses = await DepartmentModel.aggregate([
        { $unwind: "$courses" }, 
        { 
            $match: { 
                $or: [
                    { "courses.courseCode": { $regex: search, $options: "i" } },
                    { "courses.courseName": { $regex: search, $options: "i" } }
                ]
            }
        },
        { 
            $project: { 
                _id: 0,
                departmentId: "$_id",
                courseId: "$courses._id",
                courseCode: "$courses.courseCode",
                courseName: "$courses.courseName",
                academicYear: "$courses.academicYear",
                totalSemesters: "$courses.totalSemesters",
                semester: "$courses.semester"
            }
        }
    ]);

    if (matchedCourses.length === 0) {
        throw createHttpError(404, "No matching courses found.");
    }

    return formatResponse(res, 200, "Courses found", true, matchedCourses);
});


export const fetchCourses  = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
        const departments = await DepartmentModel.find({}, "courses").lean();

        const uniqueCourses = new Map();

        departments.forEach(department => {
            department.courses.forEach(course => {
                uniqueCourses.set(course.courseCode, course.courseName);
            });
        });

        const formattedCourses = Array.from(uniqueCourses, ([courseCode, courseName]) => ({ courseCode, courseName }));

        if (formattedCourses.length === 0) {
            throw createHttpError(404, "Courses found.");
        }

        return formatResponse(res, 200, "Courses fetched successfully", true, formattedCourses);
    } 
    catch (error) 
    {
        throw createHttpError(404, 'Error fetching unique course details!');
    }
});
