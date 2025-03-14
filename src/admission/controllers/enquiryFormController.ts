import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { Enquiry } from '../models/enquiryForm';
import {
  enquiryRequestSchema,
  enquiryUpdateSchema,
  IEnquiryRequestSchema
} from '../validators/enquiryForm';
import { EnquiryApplicationId } from '../models/enquiryApplicationIdSchema';

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

    let savedResult = await newEnquiry.save();

    // console.log(savedResult)

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
    if ((error as any).code === 11000) {
      // console.log(error);
      return next(
        createHttpError(
          400,
          `Duplicate value found for Student Phone Number: ${(error as any).keyValue.studentPhoneNumber}`
        )
      );
    }

    console.log(error);
    return next(createHttpError(500, 'Failed to create enquiry', { error }));
  }
};

export const updateEnquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validation = enquiryUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }

    const { _id, ...data } = validation.data;

    //No need to check ID here because we will get it for sure.
    //   if (!_id) {
    //     throw createHttpError(400, '_id is required for updating an enquiry');
    //   }

    const updatedData = await Enquiry.findByIdAndUpdate(
      req.body._id,
      { ...req.body },
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
    if ((error as any).code === 11000) {
      // console.log(error);
      return next(
        createHttpError(
          400,
          `Duplicate value found for Student Phone Number: ${(error as any).keyValue.studentPhoneNumber}`
        )
      );
    }

    console.log(error);
    return next(createHttpError(500, 'Failed to create enquiry', { error }));
  }
};

export const getEnquiryData = async (req: Request, res: Response, next: NextFunction) => {
  const enquiryData = Enquiry.find();
  res.status(200).json({
    data: enquiryData
  });
};
