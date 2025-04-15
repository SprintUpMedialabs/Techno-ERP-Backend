import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { formatResponse } from "../../utils/formatResponse";
import { departmentSchema, departmentUpdateSchema } from "../validators/departmentSchema";
import { DepartmentModel } from "../models/department";

export const createDepartment = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { departmentName, hod } = req.body;
    const validation = departmentSchema.safeParse({ departmentName, hod });

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const newDepartment = await DepartmentModel.create(validation.data);


    return formatResponse(res, 200, 'Department created successfully', true, newDepartment);
});


export const updateDepartment = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { departmentId, hod } = req.body;
    const validation = departmentUpdateSchema.safeParse({ departmentId, hod });

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const updatedDepartment = await DepartmentModel.findByIdAndUpdate(
        validation.data.departmentId,
        { $set: { hodName: validation.data.hod } },
        { new: true, runValidators: true }
    );

    return formatResponse(res, 200, 'Department updated successfully', true, updatedDepartment);
});
