import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { Enquiry } from '../models/enquiryForm';
import { enquiryRequestSchema, IEnquiryRequestSchema } from '../validators/enquiryForm';
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
      const errorDetails = validation.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw createHttpError(400, 'Validation failed', { errors: errorDetails });
    }

    const newEnquiry = new Enquiry({
      ...data
    });

    let savedResult = await newEnquiry.save();

    // console.log(savedResult)

    //Save the status of updated serial number in db once enquiry object insertion is successful.
    let { prefix, serialNumber } = extractParts(savedResult.applicationId);

    let serial = await EnquiryApplicationId.findOne({ prefix: prefix });

    if (serial) {
      serial.lastSerialNumber = serialNumber;
      await serial.save();
    } else {
      serial = new EnquiryApplicationId({ prefix, lastSerialNumber: 100 });
      await serial.save();
    }

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
        createHttpError(400, `Duplicate value: ${(error as any).keyValue.studentPhoneNumber}`)
      );
    }

    if ((error as any).errors) {
        const errorMessages = (error as any).errors.map((err: any) => `${err.path}: ${err.message}`).join(', ');
        console.log('Validation Errors:', errorMessages);
        return next(createHttpError(400, `Validation errors: ${errorMessages}`));
      }

      
    console.log(error);
    return next(createHttpError(500, 'Failed to create enquiry', { error}));
  }
};
