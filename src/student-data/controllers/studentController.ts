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
import logger from "../../config/logger";
import { feesUpdateSchema, IFeesUpdateSchema, IStudentFeesSchema } from "../../admission/validators/studentFees";
import { fetchCourseFeeByCourse, fetchOtherFees } from "../../fees/courseAndOtherFees.controller";
import { StudentFeesModel } from "../../admission/models/studentFees";

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
  }
);


export const getStudentDataById = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, 'Invalid ID');
    }

    const student = await Student.findById(id).populate('studentFee');
    if (!student) {
      throw createHttpError(404, 'Student Details not found');
    }

    return formatResponse(res, 200, 'Student details fetched successfully', true, student);
  }
);


export const updateStudentById = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {

    const studentUpdateData: IStudentUpdateSchema = req.body;
    const validation = updateStudentSchema.safeParse(studentUpdateData);

    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      { _id: studentUpdateData.id },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      throw createHttpError(404, 'Error occurred updating student');
    }

    return formatResponse(res, 200, 'Student Updated Successfully', true, updatedStudent);
  }
);


export const updateStudentDocuments = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {

    const { id, type, dueBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, 'Invalid enquiry ID');
    }


    const file = req.file as Express.Multer.File | undefined;

    const validation = singleDocumentSchema.safeParse({
      id: id,
      type: type,
      dueBy: dueBy,
      file: file
    });

    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    // Fetch existing document details
    const existingDocument = await Student.findOne(
      { _id: id, 'documents.type': type },
      { 'documents.$': 1 }
    );

    let fileUrl;
    let finalDueBy;
    if (existingDocument?.documents) {
      fileUrl = existingDocument?.documents[0]?.fileUrl;
      finalDueBy = existingDocument?.documents[0]?.dueBy;
    }


    if (file) {
      fileUrl = await uploadToS3(id.toString(), ADMISSION, type as DocumentType, file);
      if (req.file) {
        req.file.buffer = null as unknown as Buffer;
      }
    }

    if (dueBy) {
      finalDueBy = dueBy;
    }

    if (existingDocument) {
      if (!file && !dueBy) {
        throw createHttpError(400, 'No new data provided to update');
      }

      const updateFields: any = {};
      if (fileUrl) {
        updateFields['documents.$[elem].fileUrl'] = fileUrl;
      }
      if (finalDueBy) {
        updateFields['documents.$[elem].dueBy'] = finalDueBy;
      }

      logger.info(updateFields)

      const updatedData = await Student.findOneAndUpdate(
        { _id: id, 'documents.type': type },
        { $set: updateFields },
        {
          new: true,
          runValidators: true,
          arrayFilters: [{ 'elem.type': type }],
        }
      );

      return formatResponse(res, 200, 'Document updated successfully', true, updatedData);
    }
    else {

      const documentData: Record<string, any> = { type, fileUrl };

      if (finalDueBy) {
        documentData.dueBy = finalDueBy;
      }

      const updatedData = await Student.findByIdAndUpdate(
        id,
        {
          $push: { documents: documentData },
        },
        { new: true, runValidators: true }
      );

      return formatResponse(res, 200, 'New document created successfully', true, updatedData);
    }
  }
);


export const updateStudentFee = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const feesDraftUpdateData: IFeesUpdateSchema = req.body;


  const validation = feesUpdateSchema.safeParse(feesDraftUpdateData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const studentFeeInfo = await Student.findOne({
    studentFee: feesDraftUpdateData.id,
  }, {
    course: 1 
  }
  ).lean();

  const otherFees = await fetchOtherFees();
  const semWiseFee = await fetchCourseFeeByCourse(studentFeeInfo?.course.toString() ?? '');

  const feeData: IStudentFeesSchema = {
    ...validation.data,
    otherFees: validation.data.otherFees.map(fee => ({
      ...fee,
      feeAmount: otherFees?.find(otherFee => otherFee.type == fee.type)?.fee ?? 0
    })),
    semWiseFees: validation.data.semWiseFees.map((semFee, index: number) => ({
      finalFee: semFee.finalFee,
      feeAmount: (semWiseFee?.fee[index]) ?? 0
    }))
  }

  const feesDraft = await StudentFeesModel.findByIdAndUpdate(
    feesDraftUpdateData.id,
    { $set: feeData },
    { new: true, runValidators: true }
  );

  if (!feesDraft) {
    throw createHttpError(404, 'Failed to update Fees Draft');
  }

  return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
});

