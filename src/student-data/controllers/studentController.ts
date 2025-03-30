import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { singleDocumentSchema } from "../../admission/validators/singleDocumentSchema";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ADMISSION, DocumentType } from "../../config/constants";
import { uploadToS3 } from "../../config/s3Upload";
import { formatResponse } from "../../utils/formatResponse";
import { Student } from "../models/student";
import { IStudentUpdateSchema, updateStudentSchema } from "../validators/student";
import { IStudentFilter, studentFilterSchema } from "../validators/studentFilterSchema";

export const getStudentData = expressAsyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        let { search, semester, course } = req.body;

        const studentFilter: IStudentFilter = {}

        if (semester) {
            studentFilter.semester = semester;
        }

        if (course) {
            studentFilter.course = course;
        }

        const validation = studentFilterSchema.safeParse(studentFilter);

        if (!validation.success) {
            throw createHttpError(400, validation.error.errors[0]);
        }

        const baseFilter: any = {
            $or: [
                { studentName: { $regex: search || "", $options: 'i' } },
                { universityId: { $regex: search || "", $options: 'i' } }
            ],
        };

        const filter = {
            ...baseFilter,
            ...studentFilter
        };

        const students = await Student.find(filter)
            .select({
                universityId: 1,
                studentName: 1,
                studentPhoneNumber: 1,
                fatherName: 1,
                fatherPhoneNumber: 1,
                course: 1,
                semester: 1
            });

        if (students.length > 0) {
            return formatResponse(res, 200, 'Students corresponding to your search', true, students);
        } else {
            return formatResponse(res, 200, 'No students found with this information', true);
        }
    });


export const getStudentDataById = expressAsyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw createHttpError(400, 'Invalid ID');
        }

        const student = await Student.findById(id);
        if (!student) {
            throw createHttpError(404, 'Student Details not found');
        }

        return formatResponse(res, 200, 'Student details fetched successfully', true, student);
});


export const updateStudentById = expressAsyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
        const studentUpdateData : IStudentUpdateSchema = req.body;
        const validation = updateStudentSchema.safeParse(studentUpdateData);
        if(!validation.success)
        {
            throw createHttpError(400, validation.error.errors[0]);
        }

    const updatedStudent = await Student.findByIdAndUpdate(
      { _id : id} , 
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      throw createHttpError(404, 'Error occurred updating student');
    }

    return formatResponse(res, 200, 'Student Updated Successfully', true, updatedStudent);
});



// DATODO : Need to see where the student documents should be stored.
export const updateStudentDocuments = expressAsyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const { id, type, dueBy } = req.body;
        const file = req.file as Express.Multer.File;

        const validation = singleDocumentSchema.safeParse({
            enquiryId: id,
            type,
            documentBuffer: file,
            dueBy : dueBy
        });

        if (!validation.success) {
            throw createHttpError(400, validation.error.errors[0]);
        }

        const fileUrl = await uploadToS3(
            id.toString(),
            ADMISSION,      //DTODO : Should we change folder here as it is now Student so.
            type as DocumentType,
            file
        );

        //Free memory
        if (req.file)
            req.file.buffer = null as unknown as Buffer;

        const isExists = await Student.exists({
            _id: id,
            'documents.type': type,
        });

        console.log("Is Exists : ", isExists);
        let updatedData;
        if (isExists) {
            updatedData = await Student.findOneAndUpdate(
                { _id: id, 'documents.type': type, },
                {
                    $set: { 'documents.$[elem].fileUrl': fileUrl, dueBy : dueBy },
                },
                {
                    new: true,
                    runValidators: true,
                    arrayFilters: [{ 'elem.type': type }],
                }
            );
        }
        else {
            updatedData = await Student.findByIdAndUpdate(
                id,
                {
                    $push: { documents: { type, fileUrl, dueBy } },
                },
                { new: true, runValidators: true }
            );
        }
        console.log(updatedData);
        if (!updatedData) {
            throw createHttpError(400, 'Could not upload documents');
        }

        return formatResponse(res, 200, 'Document uploaded successfully', true, updatedData);
    });