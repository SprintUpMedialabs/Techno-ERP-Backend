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

    res.status(201).json({
      success: true,
      message: 'Enquiry created successfully',
      data: {
        applicationId: savedResult.applicationId
      }
    });
  }
);


export const updateEnquiryData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {

    const validation = enquiryUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    const { _id, ...data } = validation.data;

    const updatedData = await Enquiry.findByIdAndUpdate(
      _id,
      { ...data },
      { new: true, runValidators: true }
    );

    if (!updatedData) {
      throw createHttpError(404, 'Enquiry not found');
    }

    res.status(200).json({
      success: true,
      message: 'Enquiry data updated successfully',
      data: updatedData
    });
  }
);




export const updateEnquiryDocuments = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {

    const { _id, type } = req.body;
    const file = req.file as Express.Multer.File;

    //Check validation here with the single document schema, if the file size is greater then 5MB or the file formats are not supported, it would be detected here.
    const validation = singleDocumentSchema.safeParse(
      {
        studentId: _id,
        type,
        documentBuffer: file
      }
    );

    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0])
    }

    // Upload to S3
    const fileUrl = await uploadToS3(
      _id.toString(),
      ADMISSION,
      type as DocumentType,
      file
    );

    console.log(`Uploaded file: ${fileUrl}`);

    const updatedData = await Enquiry.findByIdAndUpdate(
      // DTODO: [1] => [1,1]
      _id,
      {
        $push: { documents: { type, fileUrl } }
      },
      { new: true, runValidators: true }
    );

    if (!updatedData) {
      throw createHttpError(404, 'Enquiry not found');
    }

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: updatedData
    });
  }
);

export const getEnquiryData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const search = (req.query.search as string) || '';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const skip = (page - 1) * limit;
    const query = search
      ? {
        $or: [
          { studentName: { $regex: search, $options: 'i' } },
          { studentPhoneNumber: { $regex: search, $options: 'i' } }
        ]
      }
      : {};

    const [results, totalItems] = await Promise.all([
      Enquiry.find(query).skip(skip).limit(limit),
      Enquiry.countDocuments(query)
    ]);

    res.status(200).json({
      enquiry: results,
      total: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page
    });
  }
);
