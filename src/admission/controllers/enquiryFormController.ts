import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import mongoose, { Types } from 'mongoose';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { ADMISSION, ApplicationStatus, Course, DocumentType, FormNoPrefixes, PHOTO, TGI } from '../../config/constants';
import { uploadToS3 } from '../../config/s3Upload';
import { fetchCourseFeeByCourse, fetchOtherFees } from '../../fees/courseAndOtherFees.controller';
import { Student } from '../../student-data/models/student';
import { studentSchema } from '../../student-data/validators/student';
import { formatResponse } from '../../utils/formatResponse';
import { objectIdSchema } from '../../validators/commonSchema';
import { Enquiry } from '../models/enquiry';
import { EnquiryDraft } from '../models/enquiryDraft';
import { EnquiryApplicationId } from '../models/enquiryIdMetaDataSchema';
import { StudentFeesModel } from '../models/studentFees';
import { StudentFeesDraftModel } from '../models/studentFeesDraft';
import {
  enquiryDraftStep1RequestSchema,
  enquiryDraftStep1UpdateSchema,
  enquiryStep1RequestSchema,
  enquiryStep1UpdateRequestSchema,
  enquiryStep3UpdateRequestSchema,
  IEnquiryDraftStep1RequestSchema,
  IEnquiryDraftStep1UpdateSchema,
  IEnquiryStep1RequestSchema
} from '../validators/enquiry';
import { enquiryStatusUpdateSchema, IEnquiryStatusUpdateSchema } from '../validators/enquiryStatusUpdateSchema';
import { singleDocumentSchema } from '../validators/singleDocumentSchema';
import { feesDraftRequestSchema, feesDraftUpdateSchema, feesRequestSchema, feesUpdateSchema, IFeesDraftRequestSchema, IFeesDraftUpdateSchema, IFeesRequestSchema, IFeesUpdateSchema, IStudentFeesSchema } from '../validators/studentFees';


export const createEnquiryDraftStep1 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const enquiryDraftStep1Data: IEnquiryDraftStep1RequestSchema = req.body;

  const validation = enquiryDraftStep1RequestSchema.safeParse(enquiryDraftStep1Data);

  //This will be used for checking other validations like length of pincode, format of date, etc
  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  const enquiryDraft = await EnquiryDraft.create(validation.data);

  return formatResponse(res, 200, 'Draft created successfully', true, enquiryDraft);

})


export const updateEnquiryDraftStep1 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const enquiryDraftStep1Data: IEnquiryDraftStep1UpdateSchema = req.body;

  const validation = enquiryDraftStep1UpdateSchema.safeParse(enquiryDraftStep1Data);

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  const { id, ...newData } = validation.data;

  const updatedDraft = await EnquiryDraft.findByIdAndUpdate(
    id,
    { $set: newData },
    { new: true, runValidators: true }
  );

  if (!updatedDraft) {
    throw createHttpError(404, 'Failed to update draft');
  }

  return formatResponse(res, 200, 'Draft updated successfully', true, updatedDraft)
}
);


export const createEnquiry = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {

    const data: IEnquiryStep1RequestSchema = req.body;
    const validation = enquiryStep1RequestSchema.safeParse(data);

    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    const { id, ...enquiryData } = data;

    //Create the enquiry
    let savedResult = await Enquiry.create({ ...enquiryData });

    if (savedResult) {
      //Delete enquiry draft only if the save of enquiry is successful.
      if (id) {
        const deletedDraft = await EnquiryDraft.findByIdAndDelete(id);
        if (deletedDraft) {
          throw formatResponse(res, 201, 'Draft deleted successfully', true);
        }
        //DA Check : There are 2 possibilities here, either draft deletion is unsuccessful or the draft doesn't exists only, so what should we do here? => isExists ka check lagana hai?
      }
      return formatResponse(res, 201, 'Enquiry created successfully', true, savedResult);
    }
    else {
      throw createHttpError(404, 'Error occurred creating enquiry');
    }
  }
);



export const updateEnquiryStep1ById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = enquiryStep1UpdateRequestSchema.safeParse(req.body);

  if (!validation.success) {
    console.log(validation.error);
    throw createHttpError(400, validation.error.errors[0]);
  }
  const { id, ...data } = validation.data;

  await checkIfStudentAdmitted(id);

  const updatedData = await Enquiry.findByIdAndUpdate(
    { _id: id, applicationStatus: { $ne: ApplicationStatus.STEP_4 } },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!updatedData) {
    throw createHttpError(404, 'Enquiry occurred in updating data, this can be an approved enquiry, try updating from student');
  }

  return formatResponse(res, 200, 'Enquiry data updated successfully', true, updatedData);
});


export const createFeeDraft = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const feesDraftData: IFeesDraftRequestSchema = req.body;

  const validation = feesDraftRequestSchema.safeParse(feesDraftData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const enquiry = await Enquiry.findOne(
    {
      _id: feesDraftData.enquiryId,
      applicationStatus: ApplicationStatus.STEP_1
    },
    {
      course: 1
    }
  ).lean();

  if (!enquiry) {
    throw createHttpError(400, 'Enquiry does not exist');
  }


  const otherFees = await fetchOtherFees();
  const semWiseFee = await fetchCourseFeeByCourse(enquiry.course.toString());


  const feeData = {
    ...validation.data,
    otherFees: validation.data.otherFees?.map(fee => ({
      ...fee,
      feeAmount: fee.feeAmount ?? otherFees?.find(otherFee => otherFee.type === fee.type)?.fee ?? 0
    })) || [],

    semWiseFees: validation.data.semWiseFees?.map((semFee, index) => ({
      ...semFee,
      feeAmount: semFee.feeAmount ?? semWiseFee?.fee[index] ?? 0
    })) || []
  };

  const feesDraft = await StudentFeesDraftModel.create(feeData);

  await Enquiry.findByIdAndUpdate(
    feesDraftData.enquiryId,
    { $set: { studentFeeDraft: feesDraft._id } }
  );
  return formatResponse(res, 201, 'Fees Draft created successfully', true, feesDraft);
});


export const updateFeeDraft = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  let feesDraftData: IFeesDraftUpdateSchema = req.body;

  let { id, ...feesDraftUpdateData } = feesDraftData;

  const validation = feesDraftUpdateSchema.safeParse(feesDraftUpdateData);

  console.log("Validation Error");
  console.log(validation.error);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const updateData: any = {
    ...validation.data,
    otherFees: validation.data.otherFees?.map(fee => ({
      ...fee,
      feeAmount: fee.feeAmount ?? 0
    })),
    semWiseFees: validation.data.semWiseFees?.map(semFee => ({
      ...semFee,
      feeAmount: semFee.feeAmount ?? 0
    }))
  };

  const updatedDraft = await StudentFeesDraftModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!updatedDraft) {
    throw createHttpError(404, 'Fees Draft not found');
  }

  return formatResponse(res, 200, 'Fees Draft updated successfully', true, updatedDraft);
});


export const createEnquiryStep2 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const feesDraftData: IFeesRequestSchema = req.body;

  const validation = feesRequestSchema.safeParse(feesDraftData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  await checkIfStudentAdmitted(validation.data.enquiryId);

  const enquiry = await Enquiry.findOne(
    {
      _id: feesDraftData.enquiryId,
      applicationStatus: ApplicationStatus.STEP_1
    },
    {
      course: 1,// Only return course field
      studentFeeDraft: 1
    }
  ).lean();



  let feesDraft;
  if (enquiry) {
    const otherFees = await fetchOtherFees();
    const semWiseFee = await fetchCourseFeeByCourse(enquiry?.course.toString() ?? '');

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


    //This means that enquiry is existing
    feesDraft = await StudentFeesModel.create(feeData);
    await Enquiry.findByIdAndUpdate(
      feesDraftData.enquiryId,
      {
        $set: {
          studentFee: feesDraft._id,
          studentFeeDraft: null
        }
      },
    );

    if (enquiry?.studentFeeDraft) {
      await StudentFeesDraftModel.findByIdAndDelete(enquiry.studentFeeDraft);
    }

  }
  else {
    //Enquiry does not exist, we have to create enquiry first.
    //This will never be true as we are getting from UI so we will land into this call if and only if enquiry Id is existing.
    throw createHttpError(400, 'Enquiry does not exist');
  }

  return formatResponse(res, 201, 'Fees Draft created successfully', true, feesDraft);
});



export const updateEnquiryStep2ById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const feesDraftUpdateData: IFeesUpdateSchema = req.body;

  const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_1, ApplicationStatus.STEP_3, ApplicationStatus.STEP_4], feesDraftUpdateData);
  return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
});



const updateFeeDetails = async (applicationStatusList: ApplicationStatus[], studentFeesData: IFeesUpdateSchema) => {
  const validation = feesUpdateSchema.safeParse(studentFeesData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const enquiry = await Enquiry.findOne({
    studentFee: studentFeesData.id,
    applicationStatus: { $nin: [...applicationStatusList] }
  }, {
    course: 1 // Only return course field
  }
  ).lean();

  if (!enquiry) {
    throw createHttpError(404, 'please contact finance team to change the information');
  }

  await checkIfStudentAdmitted(enquiry._id);

  const otherFees = await fetchOtherFees();
  const semWiseFee = await fetchCourseFeeByCourse(enquiry?.course.toString() ?? '');

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
    studentFeesData.id,
    { $set: feeData },
    { new: true, runValidators: true }
  );

  if (!feesDraft) {
    throw createHttpError(404, 'Failed to update Fees Draft');
  }
  return feesDraft;
}


export const updateEnquiryStep3ById = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const validation = enquiryStep3UpdateRequestSchema.safeParse(req.body);

    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    const { id, ...data } = validation.data;

    await checkIfStudentAdmitted(id);

    const enquiry = await Enquiry.findOne({
      _id: id,
      applicationStatus: { $ne: ApplicationStatus.STEP_1 }
    }, {
      applicationStatus: 1
    });

    if (!enquiry) {
      // is it can't happen that id was not exists so case which is possible is that ki student only did step1 and came to register [we are ignoring postman possibility here]
      throw createHttpError(400, "Please complete step 2 first");
    }

    if (enquiry.applicationStatus == ApplicationStatus.STEP_4) {
      throw createHttpError(400, 'Sorry, this is approved enquiry, please go to student module to update this!');
    }

    const updatedData = await Enquiry.findByIdAndUpdate(
      id,
      {
        ...data,
        // DTODO: should we manage application status in this way or it should be seperate button upon clicking on it status will change? => Added separate endpoint
        // applicationStatus: enquiry.applicationStatus == ApplicationStatus.STEP_2 ? ApplicationStatus.STEP_3 : enquiry.applicationStatus
      },
      { new: true, runValidators: true }
    );

    return formatResponse(res, 200, 'Enquiry data updated successfully', true, updatedData);
  }
);


export const updateEnquiryDocuments = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id, type, dueBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, 'Invalid enquiry ID');
    }

    await checkIfStudentAdmitted(id);

    const file = req.file as Express.Multer.File;

    const validation = singleDocumentSchema.safeParse({
      enquiryId: id,
      type,
      documentBuffer: file,
      dueBy: dueBy
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

    return formatResponse(res, 200, 'Document uploaded successfully', true, updatedData);
  }
);


export const updateEnquiryStep4ById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const feesDraftUpdateData: IFeesUpdateSchema = req.body;

  const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_1, ApplicationStatus.STEP_2, ApplicationStatus.STEP_4], feesDraftUpdateData);
  return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
});


export const getEnquiryData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    let { search, applicationStatus } = req.body;

    if (!search) {
      search = "";
    }
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
    } else {
      return formatResponse(res, 200, 'No enquiries found with this information', true);
    }
  }
);


export const getEnquiryById = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, 'Invalid enquiry ID');
    }

    let enquiry = await Enquiry.findById(id).populate('studentFee').populate('studentFeeDraft');

    if (!enquiry) {
      const enquiryDraft = await EnquiryDraft.findById(id);
      if (enquiryDraft) {
        return formatResponse(res, 200, 'Enquiry draft details', true, enquiryDraft);
      }
    }

    return formatResponse(res, 200, 'Enquiry details', true, enquiry);
  }
);

const checkIfStudentAdmitted = async (enquiryId: Types.ObjectId) => {
  const student = await Enquiry.findById(enquiryId);
  if (student?.universityId != null) {
    throw createHttpError(400, 'Student is already admitted');
  }
  return false;
}

// DTODO: need to add transaction here.
export const approveEnquiry = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const { id } = req.body;

  const validation = objectIdSchema.safeParse(id);

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  await checkIfStudentAdmitted(id);

  const enquiry = await Enquiry.findById(id);

  if (!enquiry)
    throw createHttpError(404, 'Please create the enquiry first!');


  // DTODO : Here, the prefixes will get increamented even if the update of enquiry fails or student creation fails.

  // For this enquiry Id, we will set the university ID, form no and the photo number. 
  const prefix = getPrefixForCourse(enquiry.course as Course)

  // Update serial
  const serial = await EnquiryApplicationId.findOneAndUpdate(
    { prefix: prefix },
    { $inc: { lastSerialNumber: 1 } },
    { new: true, runValidators: true }
  );

  const formNo = `${prefix}${serial!.lastSerialNumber}`;

  const photoSerial = await EnquiryApplicationId.findOneAndUpdate(
    { prefix: FormNoPrefixes.PHOTO },
    { $inc: { lastSerialNumber: 1 } },
    { new: true, runValidators: true }
  );


  let universityId = generateUniversityId(enquiry.course, photoSerial!.lastSerialNumber);

  const approvedById = req.data?.id;

  // DTODO: we may need to change this logic [it may come from body]
  let approvedEnquiry = await Enquiry.findByIdAndUpdate(
    id,
    {
      $set: {
        formNo: formNo,
        photoNo: photoSerial!.lastSerialNumber,
        universityId: universityId,
        applicationStatus: ApplicationStatus.STEP_4,
        approvedBy: approvedById
      }
    },
    { runValidators: true, new: true, projection: { createdAt: 0, updatedAt: 0, __v: 0 } }
  );

  const studentValidation = studentSchema.safeParse(approvedEnquiry);

  if (!studentValidation.success)
    throw createHttpError(400, studentValidation.error.errors[0]);

  const student = await Student.create({
    ...studentValidation.data,
  });

  return formatResponse(res, 200, 'Student created successfully with this information', true, student);
});



export const updateStatus = (async (req: AuthenticatedRequest, res: Response) => {
  const updateStatusData: IEnquiryStatusUpdateSchema = req.body;

  const validation = enquiryStatusUpdateSchema.safeParse(updateStatusData);

  if (!validation.success) {
    throw createHttpError(404, validation.error.errors[0]);
  }

  let updateEnquiryStatus = await Enquiry.findByIdAndUpdate(updateStatusData.id, { $set: { applicationStatus: updateStatusData.newStatus } }, { runValidators: true });

  if (!updateEnquiryStatus) {
    throw createHttpError(404, 'Could not update the enquiry status');
  }
  else {
    return formatResponse(res, 200, 'Enquiry Status Updated Successfully', true);
  }

})


const generateUniversityId = (course: Course, photoSerialNumber: number) => {
  return `${TGI}${new Date().getFullYear().toString()}${course.toString()}${photoSerialNumber.toString()}`
}


const getPrefixForCourse = (course: Course): FormNoPrefixes => {
  if (course === Course.MBA) return FormNoPrefixes.TIMS;
  if (course === Course.LLB) return FormNoPrefixes.TCL;
  return FormNoPrefixes.TIHS;
};