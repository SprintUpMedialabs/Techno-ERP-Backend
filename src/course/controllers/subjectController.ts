import expressAsyncHandler from "express-async-handler";
import { Response } from "express";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ISubjectDetailsRequestSchema, ISubjectDetailsUpdateSchema, subjectDetailsRequestSchema, subjectDetailsUpdateSchema } from "../validators/subjectDetailsSchema";
import createHttpError from "http-errors";
import { CourseModel } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";
import { format } from "winston";

export const createSubject = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{
    const subjectData : ISubjectDetailsRequestSchema = req.body;
    const validation = subjectDetailsRequestSchema.safeParse(subjectData);

    if(!validation.success)
        throw createHttpError(400, validation.error.errors[0]);

    const { semesterId, subjectName, instructorName, subjectCode, schedule } = validation.data;

    const isExists = await CourseModel.exists({
        "semester._id": semesterId,
        "semester.subjects.subjectCode": subjectCode
    });

    if (isExists) throw createHttpError(400, `Subject with code '${subjectCode}' already exists`);

    const updatedSemesterSubject = await CourseModel.findOneAndUpdate(
        { "semester._id": semesterId },
        {
            $push: {
                "semester.$.subjects": {
                    subjectName,
                    instructorName,
                    subjectCode,
                    schedule
                }
            }
        },
        { new: true, runValidators: true }
    );

    if(!updatedSemesterSubject)
        throw createHttpError(404, 'Could not create the subject in this semester!');

    return formatResponse(res, 200, 'Subject created successfully', true, updatedSemesterSubject);

});


export const updateSubject = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{
    const updateSubjectData : ISubjectDetailsUpdateSchema = req.body;
    
    const validation = subjectDetailsUpdateSchema.safeParse(updateSubjectData);
    
    if(!validation.success)
        throw createHttpError(400, validation.error.errors[0]);

    const { subjectId, subjectName, instructorName, schedule} = validation.data;
    const updatedSemesterSubject = await CourseModel.findOneAndUpdate(
        { "semester.subjects._id": subjectId },
        {
            $set: {
                "semester.$.subjects.$[subject].subjectName": subjectName,
                "semester.$.subjects.$[subject].instructorName": instructorName,
                "semester.$.subjects.$[subject].schedule": schedule
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if(!updatedSemesterSubject)
        throw createHttpError(404, 'Error occurred updating subject information!');

    return formatResponse(res, 200, 'Subject Information updated successfully', true, updatedSemesterSubject);

});


export const deleteSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    
    const { id } = req.params;

    if (!id) {
        throw createHttpError(400, 'Subject ID is required');
    }

    const updatedCourse = await CourseModel.findOneAndUpdate(
        { "semester.subjects._id": id },
        {
            $pull: {
                "semester.$.subjects": { _id: id }
            }
        },
        {
            new: true
        }
    );

    if (!updatedCourse) throw createHttpError(404, 'Error occurred deleting subject');

    res.status(200).json({
        message: 'Subject deleted successfully',
        course: updatedCourse
    });
});

