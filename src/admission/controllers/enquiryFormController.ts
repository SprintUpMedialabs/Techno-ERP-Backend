import { Response } from 'express';
import createHttpError from 'http-errors';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { EnquiryApplicationId } from '../models/enquiryIdMetaDataSchema';
import { Enquiry } from '../models/enquiry';
import {
  enquiryStep1RequestSchema,
  enquiryStep1UpdateRequestSchema,
  enquiryStep3UpdateRequestSchema,
  IEnquiryStep1RequestSchema
} from '../validators/enquiry';
import expressAsyncHandler from 'express-async-handler';
import { uploadToS3 } from '../../config/s3Upload';
import { ADMISSION, FormNoPrefixes, ApplicationStatus, ApplicationStatusScore, Course, DocumentType, PHOTO, TGI } from '../../config/constants';
import { singleDocumentSchema } from '../validators/singleDocumentSchema';
import { formatResponse } from '../../utils/formatResponse';
import { feesDraftRequestSchema, feesDraftUpdateSchema, IFeesDraftRequestSchema, IFeesDraftUpdateSchema, IStudentFeesSchema } from '../validators/studentFees';
import { FeesDraftModel } from '../models/studentFees';
import { fetchCourseFeeByCourse, fetchOtherFees } from '../../fees/courseAndOtherFees.controller';
import mongoose from 'mongoose';
import { approveEnquirySchema, IApproveEnquirySchema } from '../validators/approveEnquiry';
import { enquiryStatusUpdateSchema, IEnquiryStatusUpdateSchema } from '../validators/enquiryStatusUpdateSchema';

const extractParts = (applicationId: string) => {
  const match = applicationId.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    const prefix = match[1]; //Capture letters
    const serialNumber = parseInt(match[2]); //Capture digits
    return { prefix, serialNumber };
  }
  throw new Error('Invalid applicationId format');
};



export const createEnquiry = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const data: IEnquiryStep1RequestSchema = req.body;
    const validation = enquiryStep1RequestSchema.safeParse(data);

    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    let savedResult = await Enquiry.create({ ...validation.data });

    // DA CHECK
    //Below logic is no longer needed here as we are creating that ID wala part in step 4 so let's omit it from step 1.
    //Save the status of updated serial number in db once enquiry object insertion is successful.
    // let { prefix, serialNumber } = extractParts(savedResult.applicationId);

    // let serial = await EnquiryApplicationId.findOne({ prefix: prefix });

    // serial!.lastSerialNumber = serialNumber;
    // await serial!.save();
    if (savedResult) {
      return formatResponse(res, 201, 'Enquiry created successfully', true);
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

  const feesDraftData: IFeesDraftRequestSchema = req.body;

  const validation = feesDraftRequestSchema.safeParse(feesDraftData);

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
          feesDraftId: feesDraft._id,
          applicationStatus: ApplicationStatus.STEP_2
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
  const feesDraftUpdateData: IFeesDraftUpdateSchema = req.body;

  const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_1,ApplicationStatus.STEP_3,ApplicationStatus.STEP_4], feesDraftUpdateData);
  return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
});



const updateFeeDetails = async (applicationStatusList: ApplicationStatus[], feesDraftUpdateData: IFeesDraftUpdateSchema, finalApplicationStatus?: ApplicationStatus) => {
  const validation = feesDraftUpdateSchema.safeParse(feesDraftUpdateData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  // DA CHECK : What are we doing here with student fee?
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
      applicationStatus: { $ne: ApplicationStatus.STEP_1 }  // DA CHECK : Application status mai step 4 kar diya ho then also yeh nahi chalega right or will we allow edits?
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
  const feesDraftUpdateData: IFeesDraftUpdateSchema = req.body;

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

    const enquiries = await Enquiry.find(filter, {
      studentName: 1,
      studentPhoneNumber: 1,
      applicationId: 1,
      _id: 1,
      studentFee: 1,
      applicationStatus: 1
    });

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
      .populate('feesDraftId');
    if (!enquiry) {
      throw createHttpError(404, 'Enquiry not found');
    }

    return formatResponse(res, 200, 'Enquiry details', true, enquiry);
  }
);



export const approveEnquiry = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  //We are taking course from input as we already have data populated so we have details in that one.
  const approveEnquiryData: IApproveEnquirySchema = req.body;

  const validation = approveEnquirySchema.safeParse(approveEnquiryData);

  if (!validation.success) {
    throw createHttpError(404, validation.error.errors[0]);
  }

  // For this enquiry Id, we will set the university ID, form no and the photo number. 
  const prefix = getPrefixForCourse(approveEnquiryData.course as Course)
  let serial = await EnquiryApplicationId.findOne({ prefix: prefix });
  serial!.lastSerialNumber += 1;
  await serial!.save();

  let formNo = `${prefix}${serial!.lastSerialNumber}`

  let photoSerial = await EnquiryApplicationId.findOne({ prefix: PHOTO });
  photoSerial!.lastSerialNumber += 1;
  await photoSerial!.save();

  let universityId = generateUniversityId(approveEnquiryData.course, photoSerial!.lastSerialNumber);

  let approvedEnquiry = await Enquiry.findByIdAndUpdate(approveEnquiryData.id,
    {
      $set: { formNo: formNo, photoNo: photoSerial!.lastSerialNumber, universityId: universityId, applicationStatus: ApplicationStatus.STEP_4 }
    },
    { runValidators: true });

  if (!approvedEnquiry) {
    throw createHttpError(404, 'Failed to approve enquiry!');
  }
  else {
    return formatResponse(res, 200, 'Enquiry Approved Successfully', true);
  }

});



export const updateStatus = (async (req: AuthenticatedRequest, res: Response) => {
  const updateStatusData: IEnquiryStatusUpdateSchema = req.body;

  const validation = enquiryStatusUpdateSchema.safeParse(updateStatusData);

  if (!validation.success) {
    throw createHttpError(404, validation.error.errors[0]);
  }


  if (ApplicationStatusScore.indexOf(updateStatusData.newStatus) <= ApplicationStatusScore.indexOf(updateStatusData.oldStatus)) {
    throw createHttpError(404, 'Cannot update the status');
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