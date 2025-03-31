import expressAsyncHandler from "express-async-handler";
import {  Response } from "express";
import createHttpError from "http-errors";
import { Types } from "mongoose";
import { DepartmentModel } from "../models/department";
import { ISubjectDetailsRequestSchema, ISubjectDetailsUpdateSchema, subjectDetailsRequestSchema, subjectDetailsUpdateSchema } from "../validators/subjectDetailsSchema";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { formatResponse } from "../../utils/formatResponse";


export const createSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const  subjectData : ISubjectDetailsRequestSchema = req.body;

    const validation = subjectDetailsRequestSchema.safeParse(subjectData);

    if(!validation.success)
    {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const { semesterId, ...subjectCreateData } = validation.data;

    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        { "courses.semester._id": validation.data.semesterId },
        { $push: { "courses.$[].semester.$[sem].subjectDetails": { ...subjectCreateData, schedule: [] } } }, 
        { 
            arrayFilters: [{ "sem._id": semesterId }], 
            new: true, 
        }
    );

    console.log(updatedDepartment);
    if (!updatedDepartment) {
        throw createHttpError(404, "Semester not found.");
    }

    return formatResponse(res, 201, 'Subject Added successfully', true, updatedDepartment.courses[0].semester[0])
});


export const updateSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const  subjectData : ISubjectDetailsUpdateSchema = req.body;

    const validation = subjectDetailsUpdateSchema.safeParse(subjectData);

    if(!validation.success)
    {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const { subjectId, ...subjectUpdateData} = validation.data
    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        { "courses.semester.subjectDetails._id": subjectId },
        { $set: { "courses.$[].semester.$[].subjectDetails.$[subj]": subjectUpdateData } }, 
        { 
            arrayFilters: [{ "subj._id": subjectId }], 
            new: true, 
        }
    );

    if(!updatedDepartment)
        throw createHttpError(404, 'Failed updating the subject information');

    return formatResponse(res, 200, 'Subject Updated Successfully', true, updatedDepartment.courses[0].semester[0])
});



export const deleteSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subjectId } = req.body;

    if (!Types.ObjectId.isValid(subjectId)) {
        throw createHttpError(400, "Invalid Subject ID");
    }

    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        { "courses.semester.subjectDetails._id": subjectId },
        { $pull: { "courses.$[].semester.$[].subjectDetails": { _id: subjectId } } }, 
        { 
            new: true, 
        }
    );

    if (!updatedDepartment) {
        throw createHttpError(404, "Subject not found.");
    }

    return formatResponse(res, 200, 'Subject Deleted Successfully', true, updatedDepartment);
});
