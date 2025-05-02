import mongoose from "mongoose";
import { StudentFeesModel } from "../../admission/models/studentFees";
import { FinanceFeeSchedule, FinanceFeeType } from "../../config/constants";
import { Course } from "../../course/models/course";
import { getCurrentAcademicYear } from "../../course/utils/getCurrentAcademicYear";
import { IFeeSchema } from "../validators/feeSchema";
import { IAttendanceSchema, ICreateStudentSchema, IExamSchema, updateStudentDetailsRequestSchema, updateStudentPhysicalDocumentRequestSchema } from "../validators/studentSchema";
import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { Student } from "../models/student";
import createHttpError from "http-errors";
import { formatResponse } from "../../utils/formatResponse";

export const createStudent = async (studentData: ICreateStudentSchema) => {
  const { courseCode, feeId, dateOfAdmission } = studentData;

  const studentBaseInformation = {
    ...studentData
  };

  console.log("Student INformation is : ", studentBaseInformation);

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

  const currentAcademicYear = getCurrentAcademicYear();

  const totalSemesters = course?.totalSemesters!;

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
      const attendance: IAttendanceSchema[] = [];
      const exams: IExamSchema[] = [];
      subjects.push({
        subjectId: subjectId,
        attendance: attendance,
        exams: exams
      });
    }
    const fees = createSemesterFee(i, feesCourse);
    semesterArray.push({
      semesterId: semesterId,
      semesterNumber: semesterNumber,
      academicYear: academicYear,
      courseYear: courseYear,
      subjects: subjects,
      fees: fees
    })
  }
  const student = {
    studentInfo: studentBaseInformation,
    courseId: courseId,
    departmentMetaDataId: departmentMetaDataId,
    courseName: courseName,
    courseCode: courseCode,
    startingYear: dateOfAdmission.getFullYear(),
    currentSemester: currentSemester,
    currentAcademicYear: currentAcademicYear,
    totalSemester: totalSemesters,
    semester: semesterArray,
  }

  return student;
}

const createSemesterFee = (semesterNumber: number, feesCourse: any): IFeeSchema => {

  const otherFees = feesCourse.otherFees || [];
  const semWiseFees = feesCourse.semWiseFees || [];

  const getFeeDetail = (type: string) => {
    return otherFees.find((fee: any) => fee.type === type);
  };

  let requiredFeeTypes: FinanceFeeType[] = [];

  if (semesterNumber === 1) {
    requiredFeeTypes = [
      FinanceFeeType.HOSTEL,
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
      FinanceFeeType.HOSTEL,
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

  const details = requiredFeeTypes.map((type) => {
    const feeDetail = getFeeDetail(type);

    let actualFee = 0;
    let finalFee = 0;
    let paidAmount = 0;

    if (feeDetail) {
      if (semesterNumber % 2 === 0) {
        if (
          type === FinanceFeeType.HOSTEL ||
          type === FinanceFeeType.TRANSPORT ||
          type === FinanceFeeType.PROSPECTUS ||
          type === FinanceFeeType.STUDENTID ||
          type === FinanceFeeType.UNIFORM ||
          type === FinanceFeeType.STUDENTWELFARE
        ) {
          actualFee = 0;
          finalFee = 0;
          paidAmount = 0;
        } else {
          actualFee = feeDetail.feeAmount;
          finalFee = feeDetail.finalFee;
          paidAmount = feeDetail.feesDepositedTOA || 0;
        }
      } else {
        actualFee = feeDetail.feeAmount;
        finalFee = feeDetail.finalFee;
        paidAmount = feeDetail.feesDepositedTOA || 0;
      }
    }

    return {
      type: type,
      schedule: FinanceFeeSchedule[type] ?? "YEARLY",
      actualFee,
      finalFee,
      paidAmount,
      remark: "",
    };
  });

  const semFeeInfo = semWiseFees[semesterNumber - 1] || null;

  if (semFeeInfo) {
    details.push({
      type: FinanceFeeType.SEMESTERFEE,
      schedule: FinanceFeeSchedule[FinanceFeeType.SEMESTERFEE] ?? "YEARLY",
      actualFee: semFeeInfo.actualFee || 0,
      finalFee: semFeeInfo.finalFee || 0,
      paidAmount: semFeeInfo.feesPaid || 0,
      remark: "",
    });
  }

  const totalFinalFee = details.reduce((sum, item) => sum + item.finalFee, 0);
  const totalPaidAmount = details.reduce((sum, item) => sum + item.paidAmount, 0);

  return {
    details: details,
    dueDate: undefined,
    paidAmount: totalPaidAmount,
    totalFinalFee: totalFinalFee,
  };
};

export const getStudentDataBySearch = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.body.page) || 1;
  const limit = parseInt(req.body.limit) || 10;

  if (page < 1 || limit < 1) {
    throw createHttpError(400, 'Page and limit must be positive integers');
  }

  const skip = (page - 1) * limit;

  // Fetch students with pagination
  const [students, total] = await Promise.all([
    Student.find().skip(skip).limit(limit),
    Student.countDocuments()
  ]);

  // Send response
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

  const student = await Student.findById(id);
  if (!student) {
    throw createHttpError(404, 'Student not found');
  }

  console.log(student);
  return formatResponse(res, 200, 'ok', true, student);
});

export const updateStudentDataById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = updateStudentDetailsRequestSchema.safeParse(req.body);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }
  const { id, ...studentDetails } = validation.data;

  const updatedStudent = await Student.findByIdAndUpdate(
    id,
    { $set: studentDetails },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedStudent) {
    throw createHttpError(404, 'Student not found');
  }
  return formatResponse(res, 200, 'Student details updated successfully', true, updatedStudent);
});

export const updateStudentPhysicalDocumentById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = updateStudentPhysicalDocumentRequestSchema.safeParse(req.body);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { id, ...physicalDocumentList } = validation.data;

  const updatedStudent = await Student.findByIdAndUpdate(
    id,
    { $set: { physicalDocumentNote: physicalDocumentList } },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedStudent) {
    throw createHttpError(404, 'Student not found');
  }

  return formatResponse(res, 200, 'Student details updated successfully', true, updatedStudent);
});