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
            runValidators: true
        }
    );

    const updatedCourse  = await DepartmentModel.findOne(
        { "courses.semester._id": semesterId },
        { "courses.$": 1 } 
    );

    if (!updatedDepartment) {
        throw createHttpError(404, "Failed creating subject");
    }

    return formatResponse(res, 201, 'Subject Added successfully', true, updatedCourse);
});

export const updateSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subjectData: ISubjectDetailsUpdateSchema = req.body;

    const validation = subjectDetailsUpdateSchema.safeParse(subjectData);

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }


    const { subjectId, ...subjectUpdateData } = validation.data;
    console.log(subjectUpdateData);


    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        { "courses.semester.subjectDetails._id": subjectId }, 
        {
            $set: { 
                "courses.$.semester.$[sem].subjectDetails.$[subj].subjectName": subjectUpdateData.subjectName, 
                "courses.$.semester.$[sem].subjectDetails.$[subj].subjectCode": subjectUpdateData.subjectCode,
                "courses.$.semester.$[sem].subjectDetails.$[subj].instructor": subjectUpdateData.instructor,
            }
        },
        {
            arrayFilters: [
                { "sem.subjectDetails._id": subjectId }, 
                { "subj._id": subjectId } 
            ],
            projection: { "courses.$": 1 } 
        }
    );
    
    return formatResponse(res, 200, 'Subject Updated Successfully', true, updatedDepartment);
});




export const deleteSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subjectId, semesterId } = req.body;

    if (!Types.ObjectId.isValid(subjectId) || !Types.ObjectId.isValid(semesterId)) {
        throw createHttpError(400, "Invalid subjectId or semesterId");
    }

    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        {
            "courses.semester._id": semesterId,
            "courses.semester.subjectDetails._id": subjectId
        },
        {
            $pull: {
                "courses.$.semester.$[sem].subjectDetails": { _id: subjectId }
            }
        },
        {
            new: true, 
            arrayFilters: [
                { "sem._id": semesterId } 
            ],
            projection: {
                "courses": {
                    $elemMatch: {
                        "semester._id": semesterId
                    }
                }
            }
        }
    );

    return formatResponse(res, 200, "Subject deleted successfully", true, updatedDepartment);
});
