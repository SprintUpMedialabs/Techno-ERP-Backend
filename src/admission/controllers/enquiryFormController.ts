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

export const createEnquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: IEnquiryRequestSchema = req.body;
    const validation = enquiryRequestSchema.safeParse(data);

    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    const newEnquiry = new Enquiry({
      ...data
    });

    // DTODO: why we are not using create here? lets use that only [to make things identical - as we already used it in marketing module]
    let savedResult = await newEnquiry.save();

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
  } catch (error) {
    // DTODO: do you think here catch is required? we are handling this error with handleMongooseError middleware so just do one thing write this meaning full msg there and lets remove this catch from here
    if ((error as any).code === 11000) {
      // console.log(error);
      // DTODO: same as below
      return next(
        createHttpError(
          400,
          `Duplicate value found for Student Phone Number: ${(error as any).keyValue.studentPhoneNumber}`
        )
      );
    }

    console.log(error);
    // DTODO: same as below
    return next(createHttpError(500, 'Failed to create enquiry', { error }));
  }
};
// DTODO: lets use AuthenticatedRequest only jiiii also do same in above function
export const updateEnquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validation = enquiryUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    const { _id, ...data } = validation.data;

    const updatedData = await Enquiry.findByIdAndUpdate(
      // DTODO: here use _id jii
      req.body._id,
      { ...req.body }, // we alread have name data then put that one here [reason: body will _id also. yes i know it will be same any way we have variable so lets use it 😊]
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
  } catch (error) {
    // DTODO: do you think here catch is required? we are handling this error with handleMongooseError middleware so just do one thing write this meaning full msg there and lets remove this catch from here
    if ((error as any).code === 11000) {
      // DTODO: why next? just throw createHttpError
      return next(
        createHttpError(
          400,
          `Duplicate value found for Student Phone Number: ${(error as any).keyValue.studentPhoneNumber}`
        )
      );
    }

    // D-TODO: here next is not required also don't give 500. just have throw error.
    //  reason: because we are not whay went wrong so just throw error global handler will manage it
    return next(createHttpError(500, 'Failed to create enquiry', { error }));
  }
};

export const getEnquiryData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const search = (req.query.search as string) || "";
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  const skip = (page - 1) * limit;
  const query = search
    ? {
      $or: [
        { studentName: { $regex: search, $options: "i" } },
        { studentPhoneNumber: { $regex: search, $options: "i" } },
      ],
    }
    : {};

  const [results, totalItems] = await Promise.all([
    Enquiry.find(query).skip(skip).limit(limit),
    Enquiry.countDocuments(query),
  ]);

  res.status(200).json({
    enquiry: results,
    total: totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: page,
  });
};