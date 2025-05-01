import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { ApplicationStatus, Course, FormNoPrefixes, TGI } from '../../config/constants';
import { functionLevelLogger } from '../../config/functionLevelLogging';
import { createStudent } from '../../student/controllers/studentController';
import { Student } from '../../student/models/student';
import { CreateStudentSchema, StudentSchema } from '../../student/validators/studentSchema';
import { formatResponse } from '../../utils/formatResponse';
import { objectIdSchema } from '../../validators/commonSchema';
import { Enquiry } from '../models/enquiry';
import { EnquiryDraft } from '../models/enquiryDraft';
import { EnquiryApplicationId } from '../models/enquiryIdMetaDataSchema';


export const getEnquiryData = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  let { search, applicationStatus } = req.body;

  search ??='';

  const filter: any = {
    $or: [
      { studentName: { $regex: search, $options: 'i' } },
      { studentPhoneNumber: { $regex: search, $options: 'i' } }
    ]
  };

  // Validate applicationStatus
  if (applicationStatus) {
    const validStatuses = Object.values(ApplicationStatus);
    if (!validStatuses.includes(applicationStatus)) {
      throw createHttpError(400, 'Invalid application status');
    }
    filter.applicationStatus = applicationStatus;
  }

  const enquiries = await Enquiry.find(filter)
    .select({
      _id: 1,
      dateOfEnquiry: 1,
      studentName: 1,
      studentPhoneNumber: 1,
      gender: 1,
      address: 1,
      course: 1,
      applicationStatus: 1,
      fatherPhoneNumber: 1,
      motherPhoneNumber: 1
    })

  const enquiryDrafts = await EnquiryDraft.find(filter).select({
    _id: 1,
    dateOfEnquiry: 1,
    studentName: 1,
    studentPhoneNumber: 1,
    gender: 1,
    address: 1,
    course: 1,
    applicationStatus: 1,
    fatherPhoneNumber: 1,
    motherPhoneNumber: 1
  });

  const combinedResults = [...enquiries, ...enquiryDrafts];

  if (combinedResults.length > 0) {
    return formatResponse(res, 200, 'Enquiries corresponding to your search', true, combinedResults);
  }
  else {
    return formatResponse(res, 200, 'No enquiries found with this information', true);
  }

}));


export const getEnquiryById = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response): Promise<void> => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, 'Invalid enquiry ID');
  }

  let enquiry = await Enquiry.findById(id).populate('studentFee').populate('studentFeeDraft');

  if (!enquiry) {
    const enquiryDraft = await EnquiryDraft.findById(id);
    if (enquiryDraft) {
      const course = enquiryDraft.course;

      const enquiryPayload = {
        ...enquiryDraft.toObject(),
        collegeName: course ? getCollegeName(course) : null,
        affiliation: course ? getAffiliation(course) : null,
      };

      return formatResponse(res, 200, 'Enquiry draft details', true, enquiryPayload);
    } else {
      throw createHttpError(404, 'Enquiry not found');
    }
  } else {
    const course = enquiry.course;

    const enquiryPayload = {
      ...enquiry.toObject(),
      collegeName: course ? getCollegeName(course) : null,
      affiliation: course ? getAffiliation(course) : null,
    };

    return formatResponse(res, 200, 'Enquiry details', true, enquiryPayload);
  }

}));


export const approveEnquiry = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.body;

  const validation = objectIdSchema.safeParse(id);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  // await checkIfStudentAdmitted(id);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const enquiry = await Enquiry.findById(id).session(session);
    if (!enquiry) {
      throw createHttpError(404, 'Please create the enquiry first!');
    }

    const prefix = getCollegeName(enquiry.course as Course);

    const serial = await EnquiryApplicationId.findOneAndUpdate(
      { prefix: prefix },
      { $inc: { lastSerialNumber: 1 } },
      { new: true, runValidators: true, session }
    );

    const formNo = `${prefix}${serial!.lastSerialNumber}`;

    const photoSerial = await EnquiryApplicationId.findOneAndUpdate(
      { prefix: FormNoPrefixes.PHOTO },
      { $inc: { lastSerialNumber: 1 } },
      { new: true, runValidators: true, session }
    );

    const universityId = generateUniversityId(enquiry.course, photoSerial!.lastSerialNumber);
    
    const approvedEnquiry = await Enquiry.findByIdAndUpdate(
      id,
      {
        $set: {
          formNo: formNo,
          photoNo: photoSerial!.lastSerialNumber,
          universityId: universityId,
          applicationStatus: ApplicationStatus.CONFIRMED,
        },
      },
      { runValidators: true, new: true, projection: { createdAt: 0, updatedAt: 0, __v: 0 }, session }
    );

    // const studentValidation = studentSchema.safeParse(approvedEnquiry);

    const enquiryData = approvedEnquiry?.toObject();

    // console.log("Approved ENquiry is : ", enquiryData);

    const studentData = {
      // "studentName" : approvedEnquiry?.studentName,
      // "studentPhoneNumber" : approvedEnquiry?.studentPhoneNumber,
      // "fatherName" : approvedEnquiry?.fatherName,
      // "fatherPhoneNumber" : approvedEnquiry?.fatherPhoneNumber,
      // "studentId" : approvedEnquiry?.universityId,
      ...enquiryData,
      "courseCode" : approvedEnquiry?.course,
      "feeId" : approvedEnquiry?.studentFee,
      "dateOfAdmission" : approvedEnquiry?.dateOfAdmission
    }


    console.log("Student Data : ", studentData);

    const studentValidation = CreateStudentSchema.safeParse(studentData);

    console.log("Student Validation Errors : ", studentValidation.error);

    if (!studentValidation.success)
      throw createHttpError(400, studentValidation.error.errors[0]);


    // const student = await Student.create([{
    //   _id: enquiry._id,
    //   ...studentValidation.data,
    // }], { session });

    const student = await createStudent(studentValidation.data);
    const studentCreateValidation = StudentSchema.safeParse(student);

    console.log("Student create validation errors : ", studentCreateValidation.error);

    if(!studentCreateValidation.success)
      throw createHttpError(400, studentCreateValidation.error.errors[0]);

    const createdStudent = await Student.create([{
      _id: enquiry._id,
      ...studentCreateValidation.data,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return formatResponse(res, 200, 'Student created successfully with this information', true, createdStudent);
  }
  catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}));


export const updateStatus = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  return formatResponse(res, 200, 'Enquiry Status Updated Successfully', true);
  // const updateStatusData: IEnquiryStatusUpdateSchema = req.body;

  // const validation = enquiryStatusUpdateSchema.safeParse(updateStatusData);

  // if (!validation.success) {
  //   throw createHttpError(404, validation.error.errors[0]);
  // }

  // let updateEnquiryStatus = await Enquiry.findByIdAndUpdate(updateStatusData.id, { $set: { applicationStatus: updateStatusData.newStatus } }, { runValidators: true });

  // if (!updateEnquiryStatus) {
  //   throw createHttpError(404, 'Could not update the enquiry status');
  // }
  // else {
  //   return formatResponse(res, 200, 'Enquiry Status Updated Successfully', true);
  // }

});


const generateUniversityId = (course: Course, photoSerialNumber: number) => {
  return `${TGI}${new Date().getFullYear().toString()}${course.toString()}${photoSerialNumber.toString()}`
}


const getCollegeName = (course: Course): FormNoPrefixes => {
  if (course === Course.MBA) return FormNoPrefixes.TIMS;
  if (course === Course.LLB) return FormNoPrefixes.TCL;
  return FormNoPrefixes.TIHS;
};


const getAffiliation = (course: Course) => {
  if (course === Course.MBA)
    return "Delhi University";
  else if (course === Course.BCOM)
    return "Lucknow University";
  else
    return "ABC University";
}