import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express"
import { formatResponse } from "../../utils/formatResponse";
import { Enquiry } from "../../admission/models/enquiry";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { ADMISSION } from "../../config/constants";
import { uploadToS3 } from "../../config/s3Upload";
import { singleDocumentSchema } from "../../admission/validators/singleDocumentSchema";
import { DocumentType } from "../../config/constants";
import { studentFilterSchema, IStudentFilter } from "../validators/studentFilterSchema";
import { buildStudentFilter } from "../utils/buildStudentFilter";

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

        const enquiries = await Student.find(filter)
            .select({
                universityId: 1,
                studentName: 1,
                studentPhoneNumber: 1,
                fatherName: 1,
                fatherPhoneNumber: 1,
                course: 1,
                semester: 1
            });

        if (enquiries.length > 0) {
            return formatResponse(res, 200, 'Enquiries corresponding to your search', true, enquiries);
        } else {
            return formatResponse(res, 200, 'No enquiries found with this information', true);
        }
    });


export const getStudentDataById = expressAsyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw createHttpError(400, 'Invalid ID');
        }

        const enquiry = await Enquiry.findById(id)
            .populate('studentFee');
        if (!enquiry) {
            throw createHttpError(404, 'Student Details not found');
        }

        return formatResponse(res, 200, 'Student details fetched successfully', true, enquiry);
    });


export const updateStudentById = expressAsyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {

    });



export const updateEnquiryDocuments = expressAsyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const { id, type } = req.body;
        const file = req.file as Express.Multer.File;

        const validation = singleDocumentSchema.safeParse({
            enquiryId: id,
            type,
            documentBuffer: file
        });

        if (!validation.success) {
            throw createHttpError(400, validation.error.errors[0]);
        }

        const fileUrl = await uploadToS3(
            id.toString(),
            ADMISSION,
            type as DocumentType,
            file
        );

        //Free memory
        if (req.file)
            req.file.buffer = null as unknown as Buffer;

        const isExists = await Enquiry.exists({
            _id: id,
            'documents.type': type,
        });

        console.log("Is Exists : ", isExists);
        let updatedData;
        if (isExists) {
            updatedData = await Enquiry.findOneAndUpdate(
                { _id: id, 'documents.type': type, },
                {
                    $set: { 'documents.$[elem].fileUrl': fileUrl },
                },
                {
                    new: true,
                    runValidators: true,
                    arrayFilters: [{ 'elem.type': type }],
                }
            );
        }
        else {
            updatedData = await Enquiry.findByIdAndUpdate(
                id,
                {
                    $push: { documents: { type, fileUrl } },
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