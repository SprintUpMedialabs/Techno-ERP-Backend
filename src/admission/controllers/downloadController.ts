import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { Student } from "../../student/models/student";
import { CourseMetaData } from "../../course/models/courseMetadata";
import { CollegeMetaData } from "../models/collegeMetaData";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";
import { formatResponse } from "../../utils/formatResponse";

export const downloadAdmissionForm = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response)=>{
    const { studentId } = req.body;
    const student = await Student.findById(studentId);
    const course = await CourseMetaData.findOne({ courseCode : student?.courseCode });
    const collegeMetaData = await CollegeMetaData.findOne({ collegeName : course?.collegeName })
    const responseObj = {
        fullCollegeName : collegeMetaData?.fullCollegeName,
        affiliationName : collegeMetaData?.fullAffiliation,
        websiteUrl : collegeMetaData?.websiteLink,
        collegeEmail : collegeMetaData?.collegeEmail,
        collegeContact : collegeMetaData?.collegeContact,
        courseName : course?.fullCourseName,
        studentName : student?.studentInfo.studentName,
        studentPhoneNumber : student?.studentInfo.studentPhoneNumber,
        fatherName : student?.studentInfo.fatherName,
        fatherPhoneNumber : student?.studentInfo.fatherPhoneNumber,
        motherName : student?.studentInfo.motherName,
        motherPhoneNumber : student?.studentInfo.motherPhoneNumber,
        admissionDate : convertToDDMMYYYY(new Date()),  //DTODO : Change with original value
        dateOfBirth : convertToDDMMYYYY(student?.studentInfo.dateOfBirth!),
        emailId : student?.studentInfo.emailId,
        gender : student?.studentInfo.gender,
        religion : student?.studentInfo.religion,
        bloodGroup : student?.studentInfo.bloodGroup,
        category : student?.studentInfo.category,
        aadharNumber : student?.studentInfo.aadharNumber,
        stateOfDomicile : student?.studentInfo.stateOfDomicile,
        areaType : student?.studentInfo.areaType,
        nationality : student?.studentInfo.nationality,
        address : student?.studentInfo.address.addressLine1 + ", " + student?.studentInfo.address.addressLine2 + ", " + student?.studentInfo.address.district + ", " + student?.studentInfo.address.state + ", " + student?.studentInfo.address.country,
        pincode : student?.studentInfo.address.pincode,
        state : student?.studentInfo.address.state,
        academicDetails : student?.studentInfo.academicDetails || [],
        entranceExamDetails : student?.studentInfo.entranceExamDetails || {},
        approvedByEmailId : "dummy@gmail.com",
        approvedByContactNumber : "9876543210"
    };

    return formatResponse(res, 200, "Fetched the reciept data successfully!", true,  responseObj);
})