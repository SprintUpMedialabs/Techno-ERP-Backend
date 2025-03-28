import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { CourseModel } from "../models/course";


// export const createSemester = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

//     const validation = semesterRequestSchema.safeParse(req.body);

//     if(!validation.success)
//         throw createHttpError(400, validation.error.errors[0]);

//     const {courseId, semesterNumber, subjectDetails: semesterDetails} = validation.data;

//     const existingSemester = await CourseModel.findOne({
//         _id: courseId,
//         'semester.semesterNumber': semesterNumber
//     });

//     if (existingSemester) {
//         throw createHttpError(400, `Semester with number ${semesterNumber} already exists`);
//     }

//     const updatedCourse = await CourseModel.findByIdAndUpdate(
//         courseId,
//         {
//             $push: {
//                 semester: {
//                     semesterNumber,
//                     semesterDetails
//                 }
//             }
//         },
//         { new: true, runValidators: true }
//     );

//     if (!updatedCourse) {
//         throw createHttpError(404, 'Error occurred in creating the semester');
//     }

//     return formatResponse(res, 200, 'Semester created successfully', true, updatedCourse);
// });



// export const updateSemester = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{

//     const semesterUpdateData : ISemesterUpdateSchema = req.body; 

//     const validation = semesterUpdateSchema.safeParse(semesterUpdateData);

//     if(!validation.success)
//         throw createHttpError(400, validation.error.errors[0]);

//     const { semesterId, semesterNumber} = validation.data;

//     const updatedCourseSemester = await CourseModel.findOneAndUpdate(
//         {
//             'semester._id': semesterId
//         },
//         {
//             $set: {
//                 'semester.$.semesterNumber': semesterNumber,
//             }
//         },
//         { new: true, runValidators: true }
//     );

//     if (!updatedCourseSemester) {
//         throw createHttpError(404, 'Error occurred in updating course');
//     }

//     return formatResponse(res, 200, 'Semester updated successfully', true, updatedCourseSemester);

// });



//ID comes from req params
export const deleteSemester = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { id } = req.params;

    const deletedCourseSemester = await CourseModel.findOneAndUpdate(
        { 'semester._id': id },
        {
            $pull: { semester: { _id: id } }
        },
        { new: true }
    );

    if (!deletedCourseSemester)
        throw createHttpError(404, 'Error occurred deleting the semester.');

    res.status(200).json({
        message: 'Semester deleted successfully',
        course: deletedCourseSemester
    });
});