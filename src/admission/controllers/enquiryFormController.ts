import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { ApplicationStatus, COLLECTION_NAMES, Course, FeeActions, FormNoPrefixes, TGI, TransactionTypes } from '../../config/constants';
import { functionLevelLogger } from '../../config/functionLevelLogging';
import { createStudent } from '../../student/controllers/studentController';
import { CollegeTransaction } from '../../student/models/collegeTransactionHistory';
import { Student } from '../../student/models/student';
import { toRoman } from '../../student/utils/getRomanSemNumber';
import { CreateStudentSchema, StudentSchema } from '../../student/validators/studentSchema';
import { formatResponse } from '../../utils/formatResponse';
import { getCourseYearFromSemNumber } from '../../utils/getCourseYearFromSemNumber';
import { objectIdSchema } from '../../validators/commonSchema';
import { Enquiry } from '../models/enquiry';
import { EnquiryDraft } from '../models/enquiryDraft';
import { EnquiryApplicationId } from '../models/enquiryIdMetaDataSchema';
import { StudentFeesModel } from '../models/studentFees';


export const getEnquiryData = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  let { search, applicationStatus } = req.body;

  search ??= '';

  const filter: any = {
    $or: [
      { studentName: { $regex: search, $options: 'i' } },
      { studentPhoneNumber: { $regex: search, $options: 'i' } }
    ]
  };

  if (applicationStatus) {
    const validStatuses = Object.values(ApplicationStatus);
    //Ensure its an array
    const statuses = Array.isArray(applicationStatus) ? applicationStatus : [applicationStatus];
    const isValid = statuses.every(status => validStatuses.includes(status));
    if (!isValid) {
      throw createHttpError(400, 'One or more invalid application statuses');
    }
    filter.applicationStatus = { $in: statuses };
  }

  const combinedResults = await Enquiry.aggregate([
    { $match: filter },
    {
      $project: {
        _id: 1,
        dateOfEnquiry: { $dateToString: { format: "%d-%m-%Y", date: "$dateOfEnquiry" } },
        studentName: 1,
        studentPhoneNumber: 1,
        gender: 1,
        address: 1,
        course: 1,
        applicationStatus: 1,
        fatherPhoneNumber: 1,
        motherPhoneNumber: 1,
        updatedAt: 1,
        source: { $literal: 'enquiry' }
      }
    },
    {
      $unionWith: {
        coll: COLLECTION_NAMES.ENQUIRY_DRAFT,
        pipeline: [
          { $match: filter },
          {
            $project: {
              _id: 1,
              dateOfEnquiry: { $dateToString: { format: "%d-%m-%Y", date: "$dateOfEnquiry" } },
              studentName: 1,
              studentPhoneNumber: 1,
              gender: 1,
              address: 1,
              course: 1,
              applicationStatus: 1,
              fatherPhoneNumber: 1,
              motherPhoneNumber: 1,
              updatedAt: 1,
              source: { $literal: 'enquiryDraft' }
            }
          }
        ]
      }
    },
    { $sort: { updatedAt: -1 } }
  ]);


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
        collegeName: course ? getCollegeName(course as Course) : null,
        affiliation: course ? getAffiliation(course as Course) : null,
      };

      return formatResponse(res, 200, 'Enquiry draft details', true, enquiryPayload);
    } else {
      throw createHttpError(404, 'Enquiry not found');
    }
  } else {
    const course = enquiry.course;

    const enquiryPayload = {
      ...enquiry.toObject(),
      collegeName: course ? getCollegeName(course as Course) : null,
      affiliation: course ? getAffiliation(course as Course) : null,
    };

    return formatResponse(res, 200, 'Enquiry details', true, enquiryPayload);
  }

}));


export const approveEnquiry = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
  const { id, transactionType,transactionRemark } = req.body;

  const validation = objectIdSchema.safeParse(id);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  // await checkIfStudentAdmitted(id);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const enquiry = await Enquiry.findById(id).session(session);
    console.log("Enquiry is  : ", enquiry);
    if (!enquiry || enquiry.applicationStatus != ApplicationStatus.STEP_4) {
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

    const universityId = generateUniversityId(enquiry.course as Course, photoSerial!.lastSerialNumber);

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

    console.log("Approved ENquiry is : ", enquiryData);

    const studentData = {
      // "studentName" : approvedEnquiry?.studentName,
      // "studentPhoneNumber" : approvedEnquiry?.studentPhoneNumber,
      // "fatherName" : approvedEnquiry?.fatherName,
      // "fatherPhoneNumber" : approvedEnquiry?.fatherPhoneNumber,
      // "studentId" : approvedEnquiry?.universityId,
      ...enquiryData,
      "courseCode": approvedEnquiry?.course,
      "feeId": approvedEnquiry?.studentFee,
      "dateOfAdmission": approvedEnquiry?.dateOfAdmission,
      "collegeName": getCollegeNameFromFormNo(enquiryData?.formNo)
    }



    console.log("Student Data : ", studentData);

    const studentValidation = CreateStudentSchema.safeParse(studentData);

    console.log("create student schema : ", studentValidation.data);

    console.log("Student Validation Errors : ", studentValidation.error);

    if (!studentValidation.success)
      throw createHttpError(400, studentValidation.error.errors[0]);

    const { transactionAmount, ...student } = await createStudent(req.data?.id, studentValidation.data);
    
    console.log("Transaction Amount is : ", transactionAmount);
    const studentCreateValidation = StudentSchema.safeParse(student);


    console.log("Student to be created : ", student);

    console.log("Student create validation errors : ", studentCreateValidation.error);
    console.log(studentCreateValidation.data);
    if (!studentCreateValidation.success) {
      throw createHttpError(400, studentCreateValidation.error.errors[0]);
    }

    const feeData = await StudentFeesModel.findById(enquiry.studentFee);
    const otherFeesData = feeData?.otherFees;

    const transactionSettlementHistory: { name: string; amount: number; }[] = [];

    if (otherFeesData) {
      otherFeesData.forEach(otherFees => {
        if (otherFees.feesDepositedTOA !== 0) {
          transactionSettlementHistory.push({
            name: student.currentAcademicYear + " - " + "First Year" + " - " + toRoman(1) + " Sem" + " - " + otherFees.type,
            amount: otherFees.feesDepositedTOA
          });
        }
      });
    }

    console.log("Transaction Amount : ", transactionAmount);
    console.log("Transaction Settlement History : ", transactionSettlementHistory);

    // DTODO: create student first and then create transaction so we can remove this 2 db call for create txn => Not possible, student mai transaction ki ID kaha se laayenge
    const createTransaction = await CollegeTransaction.create([{
      studentId: enquiry._id,
      dateTime: new Date(),
      feeAction: FeeActions.DEPOSIT,
      amount: transactionAmount,
      txnType: transactionType ?? TransactionTypes.CASH,
      actionedBy: req?.data?.id,
      transactionSettlementHistory: transactionSettlementHistory,
      remark : transactionRemark
    }], { session });

    const createdStudent = await Student.create([{
      _id: enquiry._id,
      ...studentCreateValidation.data,
      transactionHistory: [createTransaction[0]._id]
    }], { session });

    console.log("Created student is : ", createdStudent);

    console.log("STudent is : ", student);
    console.log("Couse COde : ", student.courseCode);
    console.log("COurse Name  : ", student.courseName)

    // DTODO: isme session nahi hai 🥹🥹🥹🥹 => DONE : Session added
      // but i think fine anyway this will be removed.
      await CollegeTransaction.findByIdAndUpdate(
        enquiry._id,
        {
          $set: {
            courseCode: student.courseCode,
            courseName: student.courseName,
            courseYear: getCourseYearFromSemNumber(student.currentSemester)
          }
        },
        { session } 
      );

    await session.commitTransaction();
    session.endSession();

    return formatResponse(res, 200, 'Student created successfully with this information', true, null);
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

const getCollegeNameFromFormNo = (formNo: string | undefined) => {
  if (!formNo)
    return;
  if (formNo.startsWith(FormNoPrefixes.TCL))
    return FormNoPrefixes.TCL;
  else if (formNo.startsWith(FormNoPrefixes.TIHS))
    return FormNoPrefixes.TIHS;
  else if (formNo.startsWith(FormNoPrefixes.TIMS))
    return FormNoPrefixes.TIMS
}


const getAffiliation = (course: Course) => {
  if (course === Course.MBA)
    return "Delhi University";
  else if (course === Course.BCOM)
    return "Lucknow University";
  else
    return "ABC University";
}