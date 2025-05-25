import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { Student } from "../../student/models/student";
import { CourseMetaData } from "../../course/models/courseMetadata";
import mongoose from "mongoose";
import { formatResponse } from "../../utils/formatResponse";
import { Course } from "../../course/models/course";
import { IScheduleSchema } from "../../course/validators/scheduleSchema";
import { User } from "../../auth/models/user";
import createHttpError from "http-errors";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";

interface SchedulePlan {
  _id: string;
  unit?: number;
  lectureNumber?: number;
  topicName?: string;
  date?: string;
  instructor?: mongoose.Types.ObjectId;
  actualDate?: Date;
  plannedDate?: Date;
  classStrength?: number;
  absent?: number;
  attendance?: number;
  confirmation?: string;
  remarks?: string;
  documents?: string[];
}


export const getStudentInformation = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  if (!req.data?.universityId) {
    throw new Error("University ID is missing from request data.");
  }

  const universityId = req.data.universityId;

  const student = await Student.findOne({ 'studentInfo.universityId': universityId });
  const courseMetaData = await CourseMetaData.findOne({ 'courseCode': student?.courseCode });

  const courseId = student?.courseId;

  console.log("Student id : ", student?._id);
  const { semesterId, id, ...matchedSubjects } = await getEnrolledSubjectsForStudent(student?._id)
  console.log("Matched subjects : ", matchedSubjects);


  const responseObject = {
    id: id,
    name: student?.studentInfo.studentName,
    courseId: courseId,
    semesterId: semesterId,
    lurnNumber: student?.studentInfo.lurnRegistrationNo,
    courseCode: student?.courseCode,
    currentSemester: student?.currentSemester,
    universityId: student?.studentInfo.universityId,
    studentInfo: {
      courseFullName: courseMetaData?.fullCourseName,
      studentEmail: student?.studentInfo.emailId,
      studentContactNumber: student?.studentInfo.studentPhoneNumber,
      dateOfBirth: student?.studentInfo.dateOfBirth,
      gender: student?.studentInfo.gender,
      aadharNumber: student?.studentInfo.aadharNumber
    },
    parentInfo: {
      fatherName: student?.studentInfo.fatherName,
      motherName: student?.studentInfo.motherName,
      contactNumber: student?.studentInfo.fatherPhoneNumber ?? (student?.studentInfo.motherPhoneNumber ?? ''),
    },
    academicInfo: matchedSubjects
  };

  return formatResponse(res, 200, "Student Fetched Successfully!", true, responseObject);
})

async function getEnrolledSubjectsForStudent(studentId: mongoose.Types.ObjectId | undefined) {
  if (!studentId)
    throw new Error("Invalid student ID");

  const studentDoc = await Student.findById(studentId).lean();
  const currentSem = studentDoc?.semester.find(
    (s) => s.semesterNumber === studentDoc.currentSemester
  );
  const semesterId = currentSem?.semesterId;

  const studentData = await Student.aggregate([
    {
      $match: { _id: studentId }
    },
    {
      $addFields: {
        currentSemesterData: {
          $first: {
            $filter: {
              input: "$semester",
              as: "sem",
              cond: { $eq: ["$$sem.semesterNumber", "$currentSemester"] }
            }
          }
        }
      }
    },
    {
      $project: {
        courseId: 1,
        currentSemester: 1,
        semesterId: "$currentSemesterData.semesterId",
        subjects: "$currentSemesterData.subjects"
      }
    },
    {
      $lookup: {
        from: "courses",
        let: { courseId: "$courseId", semesterId: "$semesterId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$courseId"] } } },
          {
            $project: {
              semester: {
                $filter: {
                  input: "$semester",
                  as: "sem",
                  cond: { $eq: ["$$sem._id", "$$semesterId"] }
                }
              }
            }
          },
          { $unwind: "$semester" },
          { $unwind: "$semester.subjects" },
          {
            $replaceRoot: { newRoot: "$semester.subjects" }
          }
        ],
        as: "courseSubjects"
      }
    },
    {
      $project: {
        subjects: 1,
        courseSubjects: {
          $filter: {
            input: "$courseSubjects",
            as: "subject",
            cond: {
              $in: ["$$subject._id", {
                $map: {
                  input: "$subjects",
                  as: "s",
                  in: "$$s.subjectId"
                }
              }]
            }
          }
        }
      }
    },
    { $unwind: "$courseSubjects" },
    { $unwind: "$courseSubjects.instructor" },
    {
      $unwind: {
        path: "$courseSubjects.schedule.lecturePlan",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: {
          subjectId: "$courseSubjects._id",
          instructorId: "$courseSubjects.instructor"
        },
        subjectName: { $first: "$courseSubjects.subjectName" },
        subjectCode: { $first: "$courseSubjects.subjectCode" },
        lectureCount: {
          $sum: {
            $cond: [
              { $eq: ["$courseSubjects.schedule.lecturePlan.instructor", "$courseSubjects.instructor"] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.instructorId",
        foreignField: "_id",
        as: "instructorInfo"
      }
    },
    {
      $unwind: {
        path: "$instructorInfo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 0,
        subjectId: "$_id.subjectId",
        instructorId: "$_id.instructorId",
        subjectName: 1,
        subjectCode: 1,
        numberOfLectures: "$lectureCount",
        instructorName: {
          $concat: ["$instructorInfo.firstName", " ", "$instructorInfo.lastName"]
        }
      }
    }
  ]);

  return {
    id: studentDoc?._id,
    semesterId,
    studentData
  };
}


export const getScheduleInformation = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  
  let { studentId, courseId, semesterId, subjectId } = req.body;

  studentId = new mongoose.Types.ObjectId(studentId)
  courseId = new mongoose.Types.ObjectId(courseId)
  semesterId = new mongoose.Types.ObjectId(semesterId)
  subjectId = new mongoose.Types.ObjectId(subjectId)

  const result = await Student.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(studentId) } },
    {
      $project: {
        semester: {
          $filter: {
            input: "$semester",
            as: "sem",
            cond: { $eq: ["$$sem.semesterId", semesterId] }
          }
        }
      }
    },
    { $unwind: "$semester" },
    {
      $project: {
        subjects: {
          $filter: {
            input: "$semester.subjects",
            as: "subj",
            cond: { $eq: ["$$subj.subjectId", subjectId] }
          }
        }
      }
    },
    { $unwind: "$subjects" },
    {
      $project: {
        lecturePlan: "$subjects.attendance.lecturePlan",
        practicalPlan: "$subjects.attendance.practicalPlan"
      }
    }
  ]);


  const scheduleData = await Course.aggregate([
    {
      $match: { _id: courseId }
    },
    {
      $project: {
        semester: {
          $filter: {
            input: "$semester",
            as: "sem",
            cond: { $eq: ["$$sem._id", semesterId] }
          }
        }
      }
    },
    { $unwind: "$semester" },
    {
      $project: {
        subjects: {
          $filter: {
            input: "$semester.subjects",
            as: "subj",
            cond: { $eq: ["$$subj._id", subjectId] }
          }
        }
      }
    },
    { $unwind: "$subjects" },
    {
      $project: {
        schedule: "$subjects.schedule"
      }
    }
  ]);


  const schedule = scheduleData[0].schedule || {};
  const studentSchedule = result[0] || { lecturePlan: [], practicalPlan: [] };

  const studentLecturePlan = studentSchedule.lecturePlan || [];
  const studentPracticalPlan = studentSchedule.practicalPlan || [];

  const lecturePlan = schedule.lecturePlan || [];
  const practicalPlan = schedule.practicalPlan || [];

  const additionalResources = schedule.additionalResources || [];

  const documents: { headingName: string; fileUrl: string }[] = []

  const studentLectureMap = new Map<string, boolean>(
    studentLecturePlan.map((entry: any) => [entry.id.toString(), entry.attended ?? false])
  );

  const studentPracticalMap = new Map<string, boolean>(
    studentPracticalPlan.map((entry: any) => [entry.id.toString(), entry.attended ?? false])
  );

  const instructorMap = new Map<string, string>();

  const getInstructorName = async (instructorId: string) => {
    if (instructorMap.has(instructorId)){
      return instructorMap.get(instructorId)!;
    }

    const user = await User.findById(instructorId).select("firstName lastName");
    if (!user){
      throw createHttpError("Invalid instructor ID found!");
    }

    const fullName = `${user.firstName} ${user.lastName}`;
    instructorMap.set(instructorId, fullName);
    return fullName;
  };

  const transformedLecturePlan = await Promise.all(
    lecturePlan.map(async (lecture: any) => {
      const id = lecture._id.toString();
      const isAttended = studentLectureMap.has(id) ? studentLectureMap.get(id)! : false;

      const headingName = `L-${lecture.lectureNumber}. ${lecture.topicName}`;
      if (lecture.documents) {
        lecture.documents.forEach((doc: string) => {
          documents.push({ headingName, fileUrl: doc });
        });
      }

      const instructorName = await getInstructorName(lecture.instructor.toString());

      return {
        id: lecture._id,
        unitNumber: lecture.unit ?? null,
        lectureNumber: lecture.lectureNumber ?? null,
        topicName: lecture.topicName ?? "",
        date: convertToDDMMYYYY(lecture.actualDate) ?? null,
        instructorName: instructorName,
        isAttended
      };
    })
  );

  const transformedPracticalPlan = await Promise.all(
    practicalPlan.map(async (practical: any) => {
      const id = practical._id.toString();
      const isAttended = studentPracticalMap.has(id) ? studentPracticalMap.get(id)! : false;

      const headingName = `P-${practical.lectureNumber}. ${practical.topicName}`;
      if (practical.documents) {
        practical.documents.forEach((doc: string) => {
          documents.push({ headingName, fileUrl: doc });
        });
      }

      const instructorName = await getInstructorName(practical.instructor.toString());

      return {
        id: practical._id,
        lectureNumber: practical.lectureNumber ?? null,
        topicName: practical.topicName ?? "",
        date: convertToDDMMYYYY(practical.actualDate) ?? null,
        instructorName: instructorName,
        isAttended
      };
    })
  );

  additionalResources.forEach((doc: string) => {
    documents.push({
      headingName: "General",
      fileUrl: doc
    });
  });

  const responseObject = {
    lecturePlan: transformedLecturePlan,
    practicalPlan: transformedPracticalPlan,
    documents
  };

  console.log("Response Object : ", responseObject);
  return formatResponse(res, 200, "Attendance fetched successfully", true, responseObject)

})