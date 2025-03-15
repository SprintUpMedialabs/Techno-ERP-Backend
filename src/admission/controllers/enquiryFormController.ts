import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { Enquiry } from '../models/enquiryForm';
import {
  enquiryRequestSchema,
  enquiryUpdateSchema,
  IEnquiryRequestSchema
} from '../validators/enquiryForm';
import { EnquiryApplicationId } from '../models/enquiryApplicationIdSchema';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';

const extractParts = (applicationId: string) => {
  const match = applicationId.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    const prefix = match[1]; //Capture letters
    const serialNumber = parseInt(match[2]); //Capture digits
    return { prefix, serialNumber };
  }
  throw new Error('Invalid applicationId format');
};

export const createEnquiry = async (req: AuthenticatedRequest, res: Response) => {
  const data: IEnquiryRequestSchema = req.body;
  const validation = enquiryRequestSchema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const newEnquiry = new Enquiry({
    ...data
  });

  // DTODO: why we are not using create here? lets use that only [to make things identical - as we already used it in marketing module] => Done
  // let savedResult = await newEnquiry.save();

  let savedResult = await Enquiry.create(newEnquiry);
  //Save the status of updated serial number in db once enquiry object insertion is successful.
  let { prefix, serialNumber } = extractParts(savedResult.applicationId);

  let serial = await EnquiryApplicationId.findOne({ prefix: prefix });

  serial!.lastSerialNumber = serialNumber;
  await serial!.save();

  res.status(201).json({
    success: true,
    message: 'Enquiry created successfully',
    data: {
      applicationId: newEnquiry.applicationId
    }
  });
};

// DTODO: lets use AuthenticatedRequest only jiiii also do same in above function => Done
export const updateEnquiry = async (req: AuthenticatedRequest, res: Response) => {
  const validation = enquiryUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { _id, ...data } = validation.data;

  const updatedData = await Enquiry.findByIdAndUpdate(
    // DTODO: here use _id jii => Done
    req.body._id,
    { ...data },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Enquiry updated successfully',
    data: updatedData
  });
};



export const getEnquiryData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
};
