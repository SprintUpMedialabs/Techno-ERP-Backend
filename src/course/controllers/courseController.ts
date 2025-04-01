import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express"
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { formatResponse } from "../../utils/formatResponse";
import { ICourseResponseDocument } from "../models/course";
import { DepartmentModel } from "../models/department";
import { courseRequestSchema, ICourseRequestSchema } from "../validators/courseSchema";

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


// DTODO: lets add courseCode, collegeName in update course api[lets make sure that courseCode is not duplicated]
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
    // DTODO: will have departmentId in body | will get course by id
    let { search } = req.body;
    if (!search) search = "";

    //This is will return entire object of department where course would have matched
    // find one
    const departments = await DepartmentModel.find({
        "courses": {
            $elemMatch: {
                $or: [
                    { courseCode: { $regex: search, $options: "i" } },
                    { courseName: { $regex: search, $options: "i" } }
                ]
            }
        }
    }).populate("courses");

    if (!departments.length) {
        throw createHttpError(404, "No matching courses found.");
    }
    //Here, we are getting only those documents which are necessary and which contain the matched course in department, we are ignoring other courses.
    const matchedCourses = departments.flatMap((department) =>
        (department.courses as ICourseResponseDocument[])
            .filter((course) => {
                const courseCode = course.courseCode?.toLowerCase() || "";
                const courseName = course.courseName?.toLowerCase() || "";
                return courseCode.includes(search.toLowerCase()) || courseName.includes(search.toLowerCase());
            })
            .map((course) => ({
                departmentId: department._id,
                courseId: course._id,
                courseCode: course.courseCode,
                academicYear: course.academicYear,
                totalSemesters: course.totalSemesters,
                semester: course.semester
            }))
    );

    if (matchedCourses.length === 0) {
        throw createHttpError(404, "No matching courses found.");
    }

    return formatResponse(res, 200, "Courses found", true, matchedCourses);
});