import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { departmentMetaDataSchema, departmentMetaDataUpdateSchema, IDepartmentMetaDataSchema, IUpdateDepartmentMetaDataSchema } from "../validators/departmentSchema";
import { Response } from "express";
import createHttpError from "http-errors";
import { DepartmentMetaData } from "../models/department";
import { formatResponse } from "../../utils/formatResponse";

export const createDepartmentMetaData = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{
    const departmentMetaData : IDepartmentMetaDataSchema = req.body;
    const validation = departmentMetaDataSchema.safeParse(departmentMetaData);

    if(!validation.success)
        throw createHttpError(400, validation.error.errors[0]);

    // DTODO (ICEBOXED) : Do we want to keep check here : Check is there any existing course with incoming course name, set ending year there and then create new one.
    const department = await DepartmentMetaData.create(validation.data);

    return formatResponse(res, 201, 'Department Meta Data added successfully', true, department);
});


export const updateDepartmentMetaData = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{
    const departmentMetaData : IUpdateDepartmentMetaDataSchema = req.body;
    const validation = departmentMetaDataUpdateSchema.safeParse(departmentMetaData);

    if(!validation.success)
        throw createHttpError(400, validation.error.errors[0]);

    const { departmentMetaDataID, ...latestData } = validation.data;

    const updatedDepartmentMetaData = await DepartmentMetaData.findByIdAndUpdate(
        departmentMetaDataID,
        { $set: latestData },
        { new: true, runValidators : true } 
    );

    if(!updatedDepartmentMetaData){
        throw createHttpError(404, 'Department Meta Data not found');
    }

    return formatResponse(res, 200, 'Department Meta Data updated successfully', true, updatedDepartmentMetaData);
});


export const getDepartmentMetaData = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response) => {
    // DTODO (DONE) : send only active department HOD 
    const currentYear = new Date().getFullYear();

    const departments = await DepartmentMetaData.find({
        $or: [
            { endingYear: { $exists: false } }, //If ending year is not present at all, this will consider it as the active dept
            { endingYear: null },               //Field present but null value is there
            { endingYear: { $gt: currentYear } }    //Field present but has value greater than current year which means its a active dept
        ]
    });

    const formattedDepartments = departments.map(dept => {
        const { _id, ...deptInfo } = dept.toObject();
        return {
            departmentMetaDataId: _id,
            ...deptInfo
        };
    });

    return formatResponse(res, 200, 'Department metadata fetched successfully', true, formattedDepartments);
})

export const fetchInstructors = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const instructors = await DepartmentMetaData.aggregate([
      {
        $unwind: "$instructors"
      },
      {
        $group: {
          _id: "$instructors"
        }
      },
      {
        $lookup: {
          from: "users", 
          localField: "_id",
          foreignField: "_id",
          as: "instructorInfo"
        }
      },
      {
        $unwind: "$instructorInfo"
      },
      {
        $project: {
          instructorId: "$instructorInfo._id",
          name: {
            $concat: ["$instructorInfo.firstName", " ", "$instructorInfo.lastName"]
          },
          email: "$instructorInfo.email"
        }
      }
    ]);
  
    return formatResponse(res, 200, 'Instructors Fetched Successfully', true, instructors);
});