import { Response } from 'express';
import createHttpError from 'http-errors';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { EnquiryApplicationId } from '../models/enquiryApplicationIdSchema';
import { Enquiry } from '../models/enquiryForm';
import {
  enquiryRequestSchema,
  enquiryUpdateSchema,
  IEnquiryRequestSchema
} from '../validators/enquiryForm';
import expressAsyncHandler from 'express-async-handler';
import { uploadToS3 } from '../../config/s3Upload';
import { ADMISSION, DocumentType } from '../../config/constants';
import { singleDocumentSchema } from '../validators/singleDocumentSchema';
import { formatResponse } from '../../utils/formatResponse';

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
    const data: IEnquiryRequestSchema = req.body;
    const validation = enquiryRequestSchema.safeParse(data);

    if (!validation.success) {
      console.log(validation.error);
      throw createHttpError(400, validation.error.errors[0]);
    }

    let savedResult = await Enquiry.create({ ...data });

    //Save the status of updated serial number in db once enquiry object insertion is successful.
    let { prefix, serialNumber } = extractParts(savedResult.applicationId);

    let serial = await EnquiryApplicationId.findOne({ prefix: prefix });

    serial!.lastSerialNumber = serialNumber;
    await serial!.save();

    return formatResponse(res, 201, 'Enquiry created successfully', true, {
      applicationId: savedResult.applicationId
    });

  }
);


export const updateEnquiryData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    console.log(req.body);
    const validation = enquiryUpdateSchema.safeParse(req.body);

    if (!validation.success) {
      console.log(validation.error.errors[0]);
      // console.log(validation.error);
      throw createHttpError(400, validation.error.errors[0]);
    }

    const { id, ...data } = validation.data;

    const updatedData = await Enquiry.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true }
    );

    if (!updatedData) {
      throw createHttpError(404, 'Enquiry not found');
    }

    return formatResponse(res, 200, 'Enquiry data updated successfully', true, updatedData);
  }
);

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
        { _id: id, 'documents.type': type },
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


export const getEnquiryData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let { search } = req.body;

    if (!search) {
      search = "";
    }

    const enquiries = await Enquiry.find({
      $or: [
        { studentName: { $regex: search, $options: 'i' } },
        { studentPhoneNumber: { $regex: search, $options: 'i' } }
      ]
    });// DTODO: name,mobileNo,applicationId,clgId,_id,feesDraftId ... other if you think IMP => Need to discuss once.

    if (enquiries.length > 0) {
      return formatResponse(res, 200, 'Enquiries corresponding to your search', true, enquiries);
    } else {
      return formatResponse(res, 200, 'No enquiries found with this information', true);
    }
  }
);

// DTODO: make simillar using status