import mongoose from "mongoose";
import { Course } from "../../course/models/course";
import { getCurrentAcademicYear } from "../../course/utils/getCurrentAcademicYear";
import { IAttendanceSchema, ICreateStudentSchema, IExamSchema, ISemesterSchema, IStudentBaseInformation } from "../validators/studentSchema";
import { StudentFeesModel } from "../../admission/models/studentFees";
import { FinanceFeeSchedule, FinanceFeeType, Schedule } from "../../config/constants";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { IFeeSchema } from "../validators/feeSchema";

export const createStudent = async (studentData : ICreateStudentSchema) => {

    const { studentName, studentPhoneNumber, fatherName, fatherPhoneNumber, studentId, courseCode, feeId, dateOfAdmission} = studentData;

    const studentBaseInformation : IStudentBaseInformation = {
        studentName : studentName,
        studentPhoneNumber : studentPhoneNumber,
        fatherName : fatherName,
        fatherPhoneNumber : fatherPhoneNumber,
        studentId : studentId
    };

    const course = await Course.findOne({ courseCode : courseCode, startingYear : dateOfAdmission.getFullYear()});

    const feesCourse = await StudentFeesModel.findOne({ _id : feeId});

    const semSubjectIds = await Course.aggregate([
        {
          $match: {
            _id : new mongoose.Types.ObjectId(course?.id)
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
    for(let i = 1;i<=totalSemesters;i++)
    {
      const semesterInfo = semSubIds[i-1];
      const semesterId = semesterInfo.semesterId;
      const semesterNumber = i;
      const academicYear = semesterInfo.academicYear;
      const courseYear = semesterInfo.courseYear;
      const subjects = [];
      for(let j = 1;j<=semesterInfo.subjectIds.length;j++)
      {
        const subjectId = semesterInfo.subjectIds[j-1];
        const attendance: IAttendanceSchema[] = [];
        const exams : IExamSchema[] = [];
        subjects.push({
          subjectId : subjectId,
          attendance : attendance,
          exams : exams
        });
      }
      const fees = createSemesterFee(i, feesCourse);
      semesterArray.push({
        semesterId : semesterId,
        semesterNumber : semesterNumber,
        academicYear : academicYear,
        courseYear : courseYear,
        subjects : subjects,
        fees : fees
      })
    }
    const student = {
      studentInfo : studentBaseInformation,
      courseId : courseId,
      departmentMetaDataId : departmentMetaDataId,
      courseName : courseName,
      courseCode : courseCode,
      startingYear : dateOfAdmission.getFullYear(),
      currentSemester : currentSemester,
      currentAcademicYear : currentAcademicYear,
      totalSemester : totalSemesters,
      semester : semesterArray,
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
    details : details,
    dueDate: undefined,
    paidAmount: totalPaidAmount,
    totalFinalFee: totalFinalFee,
  };
};
