import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express"
import { courseSchema, updateCourseSchema } from "../validators/courseSchema";
import createHttpError from "http-errors";
import { CourseModel } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";

export const createCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { createCourseData } = req.body;
    const validation = courseSchema.safeParse(createCourseData);
    console.log(validation.error?.errors);
    if (!validation.success)
        throw createHttpError(400, validation.error.errors[0]);

    const newCourse = await CourseModel.create(validation.data);

    // if (!newCourse)
    //     throw createHttpError(404, 'Could not create the course!');

    return formatResponse(res, 200, 'Course created successfully', true, newCourse);

});

export const updateCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { updateCourseData } = req.body;
    const validation = updateCourseSchema.safeParse(updateCourseData);
    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const { id, ...data } = validation.data;

    const updatedCourse = await CourseModel.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
    );

    if (!updatedCourse) {
        throw createHttpError(404, "Couldn't update course code!");
    }

    return formatResponse(res, 200, "Course updated successfully", true, updatedCourse);

});

export const searchCourse = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode, courseName } = req.body;

    // DTODO : Add validation using course code here.
    const filter: any = {};

    if (courseCode) {
        filter.courseCode = {
            $regex: courseCode ?? "",
            $options: "i"
        };
    }

    if (courseName) {
        filter.courseName = {
            $regex: courseName ?? "",
            $options: "i"
        };
    }

    const courses = await CourseModel.find(filter)
        .populate({
            path: "semester.semesterDetails.schedule",
        })
        .populate({
            path: "semester.semesterDetails",
        });

    if (courses.length === 0) {
        throw createHttpError(404, "No courses found matching the search criteria.");
    }

    return formatResponse(res, 200, "Courses found", true, courses);
});
