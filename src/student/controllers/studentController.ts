import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { StudentFeesModel } from "../../admission/models/studentFees";
import { updateStudentPhysicalDocumentRequestSchema } from "../../admission/validators/physicalDocumentNoteSchema";
import { singleDocumentSchema } from "../../admission/validators/singleDocumentSchema";
import { User } from "../../auth/models/user";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ADMISSION, DocumentType, FeeStatus, FinanceFeeSchedule, FinanceFeeType } from "../../config/constants";
import { uploadToS3 } from "../../config/s3Upload";
import { Course } from "../../course/models/course";
import { getCurrentAdmissionAcademicYear } from "../../course/utils/getCurrentAcademicYear";
import { formatResponse } from "../../utils/formatResponse";
import { removeExtraInfo, Student } from "../models/student";
import { IAttendanceSchema, ICreateStudentSchema, IExamSchema, updateStudentDetailsRequestSchema } from "../validators/studentSchema";

export const createStudent = async (id: any, studentData: ICreateStudentSchema) => {
  const { courseCode, feeId, dateOfAdmission } = studentData;

  const studentBaseInformation = {
    ...studentData
  };

  const course = await Course.findOne({ courseCode: courseCode, startingYear: dateOfAdmission.getFullYear() });

  const feesCourse = await StudentFeesModel.findOne({ _id: feeId });

  const semSubjectIds = await Course.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(course?.id)
      }
    },
    {
      $project: {
        semester: {
          $map: {
            input: "$semester",
            as: "sem",
            in: {
              semesterId: "$$sem._id",
              academicYear: "$$sem.academicYear",
              courseYear: {
                $switch: {
                  branches: [
                    { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 1] }, then: "First" },
                    { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 2] }, then: "Second" },
                    { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 3] }, then: "Third" },
                    { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 4] }, then: "Fourth" },
                    { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 5] }, then: "Fifth" },
                    { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 6] }, then: "Sixth" },
                  ],
                  default: "Unknown"
                }
              },
              subjectIds: {
                $map: {
                  input: "$$sem.subjects",
                  as: "sub",
                  in: "$$sub._id"
                }
              }
            }
          }
        }
      }
    }
  ]);

  const courseId = course?.id;
  const courseName = course?.courseName;

  const departmentMetaDataId = course?.departmentMetaDataId;

  const currentSemester = 1;

  const currentAcademicYear = getCurrentAdmissionAcademicYear();

  const totalSemesters = course?.totalSemesters!;
  let transactionAmount = 0;
  const semSubIds = semSubjectIds[0].semester;
  const semesterArray = [];
  for (let i = 1; i <= totalSemesters; i++) {
    const semesterInfo = semSubIds[i - 1];
    const semesterId = semesterInfo.semesterId;
    const semesterNumber = i;
    const academicYear = semesterInfo.academicYear;
    const courseYear = semesterInfo.courseYear;
    const subjects = [];
    for (let j = 1; j <= semesterInfo.subjectIds.length; j++) {
      const subjectId = semesterInfo.subjectIds[j - 1];
      const attendance: IAttendanceSchema = {};
      const exams: IExamSchema[] = [];
      subjects.push({
        subjectId: subjectId,
        attendance: attendance,
        exams: exams
      });
    }
    const { amountForTransaction, ...fees } = createSemesterFee(id, i, feesCourse);

    if (semesterNumber === 1)
      transactionAmount = amountForTransaction;

    semesterArray.push({
      // _id : semesterId,
      semesterId: semesterId,
      semesterNumber: semesterNumber,
      academicYear: academicYear,
      courseYear: courseYear,
      subjects: subjects,
      fees: fees
    })
  };
  
  const allSemestersSettled = semesterArray.every(
    (sem: any) => {
      if (!sem.fees?.dueDate)
        return true;
      return (sem.fees?.paidAmount ?? 0) >= (sem.fees?.totalFinalFee ?? 0)
    });

  const feeStatus = allSemestersSettled ? FeeStatus.PAID : FeeStatus.DUE;

  const student = {
    studentInfo: studentBaseInformation,
    courseId: courseId,
    departmentMetaDataId: departmentMetaDataId,
    courseName: courseName,
    courseCode: courseCode,
    startingYear: dateOfAdmission?.getFullYear(),
    currentSemester: currentSemester,
    currentAcademicYear: currentAcademicYear,
    totalSemester: totalSemesters,
    semester: semesterArray,
    feeStatus: feeStatus,
    collegeName: studentData.collegeName,
    transactionAmount: transactionAmount
  }

  return student;
}

const createSemesterFee = (id: any, semesterNumber: number, feesCourse: any): any => {
  const otherFees = feesCourse.otherFees ?? [];
  const semWiseFees = feesCourse.semWiseFees ?? [];

  const getFeeDetail = (type: string) => {
    return otherFees.find((fee: any) => fee.type === type);
  };

  let requiredFeeTypes: FinanceFeeType[] = [];

  if (semesterNumber === 1) {
    requiredFeeTypes = [
      FinanceFeeType.HOSTELYEARLY,
      FinanceFeeType.HOSTELCAUTIONMONEY,
      FinanceFeeType.HOSTELMAINTENANCE,
      FinanceFeeType.TRANSPORT,
      FinanceFeeType.PROSPECTUS,
      FinanceFeeType.STUDENTID,
      FinanceFeeType.UNIFORM,
      FinanceFeeType.STUDENTWELFARE,
      FinanceFeeType.BOOKBANK,
      FinanceFeeType.EXAMFEES,
      FinanceFeeType.MISCELLANEOUS,
    ];
  } else if (semesterNumber % 2 === 1) {
    requiredFeeTypes = [
      FinanceFeeType.HOSTELYEARLY,
      FinanceFeeType.HOSTELMAINTENANCE,
      FinanceFeeType.TRANSPORT,
      FinanceFeeType.STUDENTWELFARE,
      FinanceFeeType.BOOKBANK,
      FinanceFeeType.EXAMFEES,
      FinanceFeeType.MISCELLANEOUS,
    ];
  } else {
    requiredFeeTypes = [
      FinanceFeeType.BOOKBANK,
      FinanceFeeType.EXAMFEES,
      FinanceFeeType.MISCELLANEOUS,
    ];
  }

  const createFeeUpdateHistory = (amount: number) => ({
    updatedAt: new Date(),
    extraAmount: amount,
    updatedBy: id,
    updatedFee: amount,
  });

  let amountForTransaction = 0;
  const details = requiredFeeTypes.map((type) => {
    const feeDetail = getFeeDetail(type);

    let actualFee = 0;
    let finalFee = 0;
    let paidAmount = 0;

    const feeUpdateHistory = [];


    if (feeDetail) {
      if (semesterNumber % 2 === 0) {
        if (
          type === FinanceFeeType.HOSTELYEARLY ||
          type === FinanceFeeType.TRANSPORT ||
          type === FinanceFeeType.PROSPECTUS ||
          type === FinanceFeeType.STUDENTID ||
          type === FinanceFeeType.UNIFORM ||
          type === FinanceFeeType.STUDENTWELFARE
        ) {
          actualFee = 0;
          finalFee = 0;
          paidAmount = 0;
        }
        else {
          actualFee = feeDetail.feeAmount;
          finalFee = feeDetail.finalFee;
          // paidAmount = feeDetail.feesDepositedTOA || 0;
          paidAmount = 0;
        }
      }
      else {
        actualFee = feeDetail.feeAmount;
        finalFee = feeDetail.finalFee;
        if (semesterNumber !== 1)
          paidAmount = 0;
        else {
          paidAmount = feeDetail.feesDepositedTOA || 0;
          amountForTransaction = amountForTransaction + (feeDetail.feesDepositedTOA || 0);
        }
      }
      feeUpdateHistory.push(createFeeUpdateHistory(finalFee));
    }

    return {
      type: type,
      schedule: FinanceFeeSchedule[type] ?? "YEARLY",
      actualFee,
      finalFee,
      paidAmount,
      remark: "",
      feeUpdateHistory
    };
  });


  const semFeeInfo = semWiseFees[semesterNumber - 1] || null;

  if (semFeeInfo) {
    amountForTransaction = semesterNumber === 1 ? (amountForTransaction + (semFeeInfo.feesPaid || 0)) : 0;
    details.push({
      type: FinanceFeeType.SEMESTERFEE,
      schedule: FinanceFeeSchedule[FinanceFeeType.SEMESTERFEE] ?? "YEARLY",
      actualFee: semFeeInfo.feeAmount || 0,
      finalFee: semFeeInfo.finalFee || 0,
      paidAmount: semesterNumber == 1 ? getFeeDetail("SEM1FEE").feesDepositedTOA || 0 : 0,
      remark: "",
      feeUpdateHistory: [{
        updatedAt: new Date(),
        extraAmount: semFeeInfo.finalFee || 0,
        updatedFee: semFeeInfo.finalFee || 0,
        updatedBy: id
      }]
    });
  }


  const totalFinalFee = details.reduce((sum, item) => sum + item.finalFee, 0);
  const totalPaidAmount = details.reduce((sum, item) => sum + item.paidAmount, 0);
  return {
    details: details,
    dueDate: semesterNumber == 1 ? new Date() : undefined,
    paidAmount: totalPaidAmount,
    totalFinalFee: totalFinalFee,
    amountForTransaction: amountForTransaction
  };
};

const yearMapping: Record<string, number> = {
  First: 1,
  Second: 2,
  Third: 3,
  Fourth: 4,
  Fifth: 5,
  Sixth: 6,
};


export const getStudentDataBySearch = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.body.page) || 1;
  const limit = parseInt(req.body.limit) || 10;

  const { academicYear, courseCode, courseYear, search } = req.body;

  const matchStage: Record<string, any> = {};

  if (courseCode) {
    matchStage.courseCode = courseCode;
  }

  if (academicYear) {
    matchStage.currentAcademicYear = academicYear
  }

  if (courseYear) {
    const yearNumber = yearMapping[courseYear];
    if (yearNumber) {
      const semRange = [yearNumber * 2 - 1, yearNumber * 2];
      matchStage.currentSemester = { $in: semRange };
    }
  }

  if (search) {
    matchStage.$or = [
      { 'studentInfo.universityId': { $regex: search, $options: 'i' } },
      { 'studentInfo.studentPhoneNumber': { $regex: search, $options: 'i' } },
      { 'studentInfo.studentName': { $regex: search, $options: 'i' } }
    ];
  }

  if (page < 1 || limit < 1) {
    throw createHttpError(400, 'Page and limit must be positive integers');
  }

  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    Student.aggregate([
      { $match: matchStage },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          universityId: '$studentInfo.universityId',
          studentName: '$studentInfo.studentName',
          studentPhoneNumber: '$studentInfo.studentPhoneNumber',
          fatherName: '$studentInfo.fatherName',
          fatherPhoneNumber: '$studentInfo.fatherPhoneNumber',
          courseName: 1,
          courseCode: 1,
          currentAcademicYear: 1,
          currentSemester: 1,
        },
      }
    ]),
    Student.countDocuments(matchStage),
  ]);

  return formatResponse(res, 200, 'Students information fetched successfully', true, {
    students,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getStudentDataById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, 'Invalid student ID');
  }

  const student = await Student.findById(id)
    .populate({ path: 'departmentMetaDataId', select: 'departmentName' })
    .lean();

  if (!student) {
    throw createHttpError(404, 'Student not found');
  }

  const responseData = await buildStudentResponseData(student);
  const cleanedData = removeExtraInfo(null, responseData);
  return formatResponse(res, 200, 'ok', true, cleanedData);
});


export const updateStudentDataById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = updateStudentDetailsRequestSchema.safeParse(req.body);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { id, ...studentDetails } = validation.data;
  const updateFields: Record<string, any> = {};
  for (const [key, value] of Object.entries(studentDetails)) {
    updateFields[`studentInfo.${key}`] = value;
  }
  const data = await Student.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { runValidators: true }
  );

  // Refetch and populate to return same structure as getStudentDataById
  const updatedStudent = (await Student.findById(id)
    .populate({ path: 'departmentMetaDataId', select: 'departmentName' }))
    ?.toObject();

  if (!updatedStudent) {
    throw createHttpError(404, 'Student not found');
  }

  const responseData = await buildStudentResponseData(updatedStudent);
  return formatResponse(res, 200, 'Student details updated successfully', true, responseData);
});


export const updateStudentPhysicalDocumentById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = updateStudentPhysicalDocumentRequestSchema.safeParse(req.body);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { id, ...physicalDocumentList } = validation.data;

  const isStudentExist = await Student.exists({ _id: id, 'studentInfo.physicalDocumentNote.type': physicalDocumentList.type });
  let updatedStudent;
  if (isStudentExist) {
    const updateFields: any = {};
    for (const [key, value] of Object.entries(physicalDocumentList)) {
      updateFields[`studentInfo.physicalDocumentNote.$[elem].${key}`] = value;
    }

    updatedStudent = (await Student.findByIdAndUpdate(
      id,
      { $set: { ...updateFields } },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ 'elem.type': physicalDocumentList.type }]
      }
    ).populate({ path: 'departmentMetaDataId', select: 'departmentName' }))?.toObject();
  } else {
    updatedStudent = (await Student.findByIdAndUpdate(
      id,
      { $push: { 'studentInfo.physicalDocumentNote': physicalDocumentList } },
      { new: true, runValidators: true }
    ).populate({ path: 'departmentMetaDataId', select: 'departmentName' }))?.toObject();
  }

  if (!updatedStudent) {
    throw createHttpError(404, 'Student not found');
  }
  const responseData = await buildStudentResponseData(updatedStudent);
  return formatResponse(res, 200, 'Student details updated successfully', true, responseData);
});

export const updateStudentDocumentsById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

  const isStudentExist = await Student.exists({ _id: id });
  if (!isStudentExist) {
    throw createHttpError(404, 'Student not found');
  }

  const existingDocument = await Student.findOne(
    { _id: id, 'studentInfo.documents.type': type },
    { 'studentInfo.documents.$': 1 }
  );

  let fileUrl;
  let finalDueBy;
  if (existingDocument?.studentInfo.documents) {
    fileUrl = existingDocument?.studentInfo.documents[0]?.fileUrl;
    finalDueBy = existingDocument?.studentInfo.documents[0]?.dueBy;
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
      updateFields['studentInfo.documents.$[elem].fileUrl'] = fileUrl;
    }
    if (finalDueBy) {
      updateFields['studentInfo.documents.$[elem].dueBy'] = finalDueBy;
    }

    const updatedData = await Student.findOneAndUpdate(
      { _id: id, 'studentInfo.documents.type': type },
      {
        $set: {
          ...updateFields
        }
      },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ 'elem.type': type }]
      }
    ).select('studentInfo.documents');

    return formatResponse(res, 200, 'Document updated successfully', true, updatedData);
  }
  else {
    const documentData: Record<string, any> = { type, fileUrl };
    if (finalDueBy) {
      documentData.dueBy = finalDueBy;
    }
    const updatedData = await Student.findByIdAndUpdate(
      id,
      { $push: { 'studentInfo.documents': documentData } },
      { new: true, runValidators: true }
    ).select('studentInfo.documents');

    return formatResponse(res, 200, 'New document created successfully', true, updatedData);
  }

});

const buildStudentResponseData = async (student: any) => {
  const { departmentMetaDataId, ...rest } = student;
  const course = await Course.findById(student.courseId);
  if (!course) {
    throw createHttpError(404, 'Course does not exist');
  }

  for (let i = 0; i < student.semester.length; i++) {
    const studentSem = student.semester[i];
    const courseSem = course.semester![i];
    if (!courseSem) continue;

    for (let j = 0; j < studentSem.subjects.length; j++) {
      const studentSubject = studentSem.subjects[j];
      const matchedCourseSubject = courseSem.subjects.find(courseSub =>
        (courseSub as any)._id.toString() === studentSubject.subjectId.toString()
      );

      if (matchedCourseSubject) {
        studentSubject.subjectName = matchedCourseSubject.subjectName;
        studentSubject.subjectCode = matchedCourseSubject.subjectCode;

        const instructorList = [];
        for (const instructorId of matchedCourseSubject.instructor) {
          const instructor = await User.findById(instructorId).lean();
          if (instructor) {
            instructorList.push(`${instructor.firstName} ${instructor.lastName}`);
          }
        }
        studentSubject.instructor = instructorList;
      }
    }
  }

  return {
    ...rest,
    semester: student.semester,
    departmentName: departmentMetaDataId?.departmentName ?? null
  };
};


