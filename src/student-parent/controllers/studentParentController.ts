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

interface SchedulePlan {
  _id: string;
  unit?: number;
  lectureNumber?: number;
  topicName?: string;
  date?: string;
  instructor?: mongoose.Types.ObjectId;
  actualDate?: Date;
  plannedDate? : Date;
  classStrength? : number;
  absent? : number;
  attendance? : number;
  confirmation?: string;
  remarks? : string;
  documents?: string[];
}


export const getStudentInformation = expressAsyncHandler(async (req : AuthenticatedRequest, res: Response)=>{
    const { universityId } = req.body;

    const student = await Student.findOne({ 'studentInfo.universityId' : universityId });
    const courseMetaData = await CourseMetaData.findOne({ 'courseCode' : student?.courseCode });
    
    const courseId = student?.courseId;

    console.log("Student id : ", student?._id);
    const { semesterId, id, ...matchedSubjects} = await getEnrolledSubjectsForStudent(student?._id)
    console.log("Matched subjects : ", matchedSubjects);


    const responseObject = {
        id : id,
        name : student?.studentInfo.studentName,
        courseId : courseId,
        semesterId : semesterId,
        lurnNumber : student?.studentInfo.lurnRegistrationNo,
        courseCode : student?.courseCode,
        currentSemester : student?.currentSemester,
        universityId : student?.studentInfo.universityId,
        studentInfo : {
            courseFullName : courseMetaData?.fullCourseName,
            studentEmail : student?.studentInfo.emailId,
            studentContactNumber : student?.studentInfo.studentPhoneNumber,
            dateOfBirth : student?.studentInfo.dateOfBirth,
            gender : student?.studentInfo.gender,
            aadharNumber : student?.studentInfo.aadharNumber
        },
        parentInfo : {
            fatherName : student?.studentInfo.fatherName,
            motherName : student?.studentInfo.motherName,
            contactNumber : student?.studentInfo.fatherPhoneNumber ?? (student?.studentInfo.motherPhoneNumber ?? ''),
        },
        academicInfo : matchedSubjects
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
        _id : 0,
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
    id : studentDoc?._id,
    semesterId,
    studentData
  };
}


export const getScheduleInformation = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{
    let { studentId, courseId, semesterId, subjectId } = req.body;

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
          attendance: "$subjects.attendance"
        }
      },
      { $unwind: "$attendance" },
      {
        $project: {
          lecturePlan: "$attendance.lecturePlan",
          practicalPlan: "$attendance.practicalPlan"
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

    console.log("Schedule Information : ", scheduleData[0]);
    
    const schedule = scheduleData[0].schedule || {};

    const studentSchedule = result[0] || { lecturePlan: [], practicalPlan: [] };    
    console.log("schedule is ", studentSchedule);

    const studentLecturePlan = studentSchedule.lecturePlan || [];
    const studentPracticalPlan = studentSchedule.practicalPlan || [];

    console.log("STudent lecture plan schedule is : ", studentLecturePlan)
    console.log("STudent practical plan schedule is : ", studentPracticalPlan)

    const lecturePlan = schedule.lecturePlan || [];
    const practicalPlan = schedule.practicalPlan || [];
    const additionalResources = schedule.additionalResources || [];

    const lecturePlanMap = new Map<String, SchedulePlan>(
      lecturePlan.map((item: any) => [item._id.toString(), item])
    );
    const practicalPlanMap = new Map<String, SchedulePlan>(
      practicalPlan.map((item: any) => [item._id.toString(), item])
    );
    
    const documents : { headingName : string; fileUrl : string}[] = []

    const transformedLecturePlan = studentLecturePlan.map(async (entry: any) => {
      const lecture = lecturePlanMap.get(entry.id.toString());
      const lectureDocs = lecture?.documents;
      const headingName = "L - "+lecture?.lectureNumber + ". " + lecture?.topicName; 
      if(lectureDocs){
        lectureDocs.forEach(doc => {
          documents.push({
            headingName : headingName,
            fileUrl : doc
          })
        });
      }
      
      const user = await User.findById(lecture?.instructor);
      if(!user)
        throw createHttpError("Invalid instructor Id found!");
      return {
        id: entry.id,
        unitNumber: lecture?.unit ?? null,
        lectureNumber: lecture?.lectureNumber ?? null,
        topicName: lecture?.topicName ?? "",
        date: lecture?.date ?? null,
        instructorName: (user?.firstName + user?.lastName),
        isAttended: entry.attended ?? false
      };
    });
    
    const transformedPracticalPlan = studentPracticalPlan.map(async (entry: any) => {
      const practical = practicalPlanMap.get(entry.id.toString());
      const practicalDocs = practical?.documents;
      const headingName = "P - "+practical?.lectureNumber + ". " + practical?.topicName; 
      if(practicalDocs){
        practicalDocs.forEach(doc => {
          documents.push({
            headingName : headingName,
            fileUrl : doc
          })
        });
      }

      const user = await User.findById(practical?.instructor);
      if(!user)
        throw createHttpError("Invalid instructor Id found!");
      return {
        id: entry.id,
        lectureNumber: practical?.lectureNumber ?? null,
        topicName: practical?.topicName ?? "",
        date: practical?.date ?? null,
        instructorName: (user?.firstName + user?.lastName),
        isAttended: entry.attended ?? false
      };
    });

    const responseObject = {
      lecturePlan : schedule.lecturePlan || [],
      practicalPlan : schedule.practicalPlan || [],
      additionalResources : schedule.additionalResources || []
    }

    console.log("Response Object : ", responseObject);

})