import { Response } from 'express';
import createHttpError from 'http-errors';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { EnquiryApplicationId } from '../models/enquiryIdMetaDataSchema';
import { Enquiry } from '../models/enquiry';
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
import expressAsyncHandler from 'express-async-handler';
import { uploadToS3 } from '../../config/s3Upload';
import { ADMISSION, FormNoPrefixes, ApplicationStatus, Course, DocumentType, PHOTO, TGI } from '../../config/constants';
import { singleDocumentSchema } from '../validators/singleDocumentSchema';
import { formatResponse } from '../../utils/formatResponse';
import { feesDraftRequestSchema, feesDraftUpdateSchema, feesRequestSchema, feesUpdateSchema, IFeesDraftRequestSchema, IFeesDraftUpdateSchema, IFeesRequestSchema, IFeesUpdateSchema, IStudentFeesSchema } from '../validators/studentFees';
import { FeesDraftModel } from '../models/studentFees';
import { fetchCourseFeeByCourse, fetchOtherFees } from '../../fees/courseAndOtherFees.controller';
import mongoose from 'mongoose';
import { enquiryStatusUpdateSchema, IEnquiryStatusUpdateSchema } from '../validators/enquiryStatusUpdateSchema';
import { objectIdSchema } from '../../validators/commonSchema';
import { EnquiryDraft } from '../models/enquiryDraft';
import { StudentFeesDraftModel } from '../models/studentFeesDraft';


export const createEnquiryDraftStep1 = expressAsyncHandler(async (req : AuthenticatedRequest, res : Response) => {
  const enquiryDraftStep1Data : IEnquiryDraftStep1RequestSchema = req.body;

  const validation = enquiryDraftStep1RequestSchema.safeParse(enquiryDraftStep1Data);
  console.log(validation.error)
  //This will be used for checking other validations like length of pincode, format of date, etc
  if(!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  const enquiryDraft = await EnquiryDraft.create(validation.data);

  return formatResponse(res, 200, 'Draft created successfully', true, enquiryDraft);

})


export const updateEnquiryDraftStep1 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const enquiryDraftStep1Data : IEnquiryDraftStep1UpdateSchema = req.body;

  const validation = enquiryDraftStep1UpdateSchema.safeParse(enquiryDraftStep1Data);
  
  if(!validation.success)
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

    console.log(validation.error)
    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    const { id , ...enquiryData } = data; 

    
    console.log(enquiryData);

    //Create the enquiry
    let savedResult = await Enquiry.create({ ...enquiryData });

    if (savedResult) {
      //Delete enquiry draft only if the save of enquiry is successful.
      if(id)
      {
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
  const updatedData = await Enquiry.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!updatedData) {
    throw createHttpError(404, 'Enquiry occurred in updating data');
  }

  return formatResponse(res, 200, 'Enquiry data updated successfully', true, updatedData);
});




export const createEnquiryStep2 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const feesDraftData: IFeesRequestSchema = req.body;

  const validation = feesRequestSchema.safeParse(feesDraftData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const enquiry = await Enquiry.findOne(
    {
      _id: feesDraftData.enquiryId,
      applicationStatus: ApplicationStatus.STEP_1
    },
    {
      course: 1 // Only return course field
    }
  ).lean();

  if(enquiry?.studentFeeDraft)
  {
    await StudentFeesDraftModel.findByIdAndDelete(enquiry.studentFeeDraft);
  }

  let feesDraft;
  if (enquiry) {
    const otherFees = await fetchOtherFees();
    const semWiseFee = await fetchCourseFeeByCourse(enquiry?.course.toString() ?? '');

    const feeData: IStudentFeesSchema = {
      ...validation.data,
      otherFees: validation.data.otherFees!.map(fee => ({
        ...fee,
        feeAmount: otherFees?.find(otherFee => otherFee.type == fee.type)?.fee ?? 0
      })),
      semWiseFees: validation.data.semWiseFees.map((semFee, index: number) => ({
        finalFee: semFee.finalFee,
        feeAmount: (semWiseFee?.fee[index]) ?? 0
      }))
    }


    //This means that enquiry is existing
    feesDraft = await FeesDraftModel.create(feeData);
    await Enquiry.findByIdAndUpdate(
      feesDraftData.enquiryId,
      {
        $set: {
          studentFee: feesDraft._id,
        }
      },
    );
  }
  else {
    //Enquiry does not exist, we have to create enquiry first.
    //This will never be true as we are getting from UI so we will land into this call if and only if enquiry Id is existing.
    throw createHttpError(400, 'Enquiry doesnot exist');
  }

  return formatResponse(res, 201, 'Fees Draft created successfully', true, feesDraft);
});



export const updateEnquiryStep2ById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const feesDraftUpdateData: IFeesUpdateSchema = req.body;

  const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_1, ApplicationStatus.STEP_3, ApplicationStatus.STEP_4], feesDraftUpdateData);
  return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
});



const updateFeeDetails = async (applicationStatusList: ApplicationStatus[], feesDraftUpdateData: IFeesUpdateSchema, finalApplicationStatus?: ApplicationStatus) => {
  const validation = feesUpdateSchema.safeParse(feesDraftUpdateData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const enquiry = await Enquiry.findOne({
    studentFee: feesDraftUpdateData.id,
    applicationStatus: { $nin: [...applicationStatusList] }
  }, {
    course: 1 // Only return course field
  }
  ).lean();

  if (!enquiry) {
    throw createHttpError(404, 'please contact finance team to change the information');
  }

  const otherFees = await fetchOtherFees();
  const semWiseFee = await fetchCourseFeeByCourse(enquiry?.course.toString() ?? '');

  const feeData: IStudentFeesSchema = {
    ...validation.data,
    otherFees: validation.data.otherFees!.map(fee => ({
      ...fee,
      feeAmount: otherFees?.find(otherFee => otherFee.type == fee.type)?.fee ?? 0
    })),
    semWiseFees: validation.data.semWiseFees.map((semFee, index: number) => ({
      finalFee: semFee.finalFee,
      feeAmount: (semWiseFee?.fee[index]) ?? 0
    }))
  }

  const feesDraft = await FeesDraftModel.findByIdAndUpdate(
    feesDraftUpdateData.id,
    { $set: feeData },
    { new: true, runValidators: true }
  );

  if (!feesDraft) {
    throw createHttpError(404, 'Failed to update Fees Draft');
  }
  if (finalApplicationStatus) {
    await Enquiry.updateOne(
      { studentFee: feesDraftUpdateData.id },
      { applicationStatus: finalApplicationStatus },
      { runValidators: true }
    );
  }
  return feesDraft;
}


export const updateEnquiryStep3ById = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const validation = enquiryStep3UpdateRequestSchema.safeParse(req.body);

    if (!validation.success) {
      console.log(validation.error.errors[0]);
      throw createHttpError(400, validation.error.errors[0]);
    }

    const { id, ...data } = validation.data;

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

    const updatedData = await Enquiry.findByIdAndUpdate(
      id,
      {
        ...data,
        // DTODO: should we manage application status in this way or it should be seperate button upon clicking on it status will change? => Added separate endpoint
        // applicationStatus: enquiry.applicationStatus == ApplicationStatus.STEP_2 ? ApplicationStatus.STEP_3 : enquiry.applicationStatus
      },
      { new: true, runValidators: true }
    );

    if (!updatedData) {
      throw createHttpError(404, 'Enquiry not found');
    }

    return formatResponse(res, 200, 'Enquiry data updated successfully', true, updatedData);
  }
);


// DTODO: there are few documents which are IMP need to think that how will handle those => Make them mandate from the UI side.
export const updateEnquiryDocuments = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id, type } = req.body;
    const file = req.file as Express.Multer.File;

    const validation = singleDocumentSchema.safeParse({
      enquiryId: id,
      type,
      documentBuffer: file
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

    console.log("Is Exists : ", isExists);
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
    console.log(updatedData);
    if (!updatedData) {
      throw createHttpError(400, 'Could not upload documents');
    }

    return formatResponse(res, 200, 'Document uploaded successfully', true, updatedData);
  }
);


export const updateEnquiryStep4ById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const feesDraftUpdateData: IFeesUpdateSchema = req.body;

  const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_1, ApplicationStatus.STEP_2], feesDraftUpdateData, ApplicationStatus.STEP_4);
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
      _id : 1,
      dateOfEnquiry: 1,
      studentName: 1,
      studentPhoneNumber: 1,
      gender: 1,
      address : 1,
      course: 1,
      applicationStatus: 1,
      fatherPhoneNumber: 1, 
      motherPhoneNumber: 1 
    })

    if (enquiries.length > 0) {
      return formatResponse(res, 200, 'Enquiries corresponding to your search', true, enquiries);
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

    const enquiry = await Enquiry.findById(id)
      .populate('studentFee');
    if (!enquiry) {
      throw createHttpError(404, 'Enquiry not found');
    }

    return formatResponse(res, 200, 'Enquiry details', true, enquiry);
  }
);


// DTODO: lets just take _id from the frontend => Resolved
export const approveEnquiry = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const { id } = req.body;

  const validation = objectIdSchema.safeParse(id);

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  const enquiry = await Enquiry.findById(id);

  if (!enquiry)
    throw createHttpError(404, 'Please create the enquiry first!');


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
    { prefix: PHOTO },
    { $inc: { lastSerialNumber: 1 } },
    { new: true, runValidators: true }
  );



  let universityId = generateUniversityId(enquiry.course, photoSerial!.lastSerialNumber);

  const approvedById = req.data?.id;

  if (approvedById) {
    let approvedEnquiry = await Enquiry.findByIdAndUpdate(id,
      {
        $set: { formNo: formNo, photoNo: photoSerial!.lastSerialNumber, universityId: universityId, applicationStatus: ApplicationStatus.STEP_4, approvedBy: approvedById }
      },
      { runValidators: true });

    if (!approvedEnquiry) {
      throw createHttpError(404, 'Failed to approve enquiry!');
    }
    else {
      return formatResponse(res, 200, 'Enquiry Approved Successfully', true);
    }
  }
  else {
    throw createHttpError(404, 'Invalid user logged in!');
  }


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


export const createFeeDraft = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const feesDraftData: IFeesDraftRequestSchema = req.body;

  const validation = feesDraftRequestSchema.safeParse(feesDraftData);

  console.log("Validation Error")
  console.log(validation.error)

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
