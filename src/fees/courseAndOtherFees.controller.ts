import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import { FeeType } from '../config/constants';
import { CourseMetaData, IFeeItem } from '../course/models/courseMetadata';
import { formatResponse } from '../utils/formatResponse';
import { CourseAndOtherFeesModel } from './courseAndOtherFees.model';

export const createFeesStructure = async (req: Request, res: Response) => {
    const newDoc = await CourseAndOtherFeesModel.create(req.body);
    res.status(201).json(newDoc);
};

export const updateFeesStructure = async (req: Request, res: Response) => {
    const updated = await CourseAndOtherFeesModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    if (!updated) {
        throw createHttpError(404, 'Document not found');
    }
    res.json(updated);
};

export const getAllFeesStructures = async (_req: Request, res: Response) => {
    const all = await CourseAndOtherFeesModel.find();
    res.json(all);
};

export const getFeesStructureById = async (req: Request, res: Response) => {
    const doc = await CourseAndOtherFeesModel.findById(req.params.id);
    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
};

export const getCourseFeeByCourseName = expressAsyncHandler(async (req: Request, res: Response) => {
    // console.log("Here")
    const courseCode = req.params.courseCode;
    // console.log("COurse code is : ", courseCode);
    const courseFee = await fetchCourseFeeByCourse(courseCode as String);

    if(!courseFee)
        throw createHttpError(404, "Fee not found for this course");

    return formatResponse(res, 200, "Course fees fetched successfully for this course", true, courseFee);
    
});

export const getOtherFees = async (req: Request, res: Response) => {
    const courseCode = req.params.courseCode;
    const otherFees = await fetchOtherFees(courseCode as String);

    if(!otherFees)
        throw createHttpError(404, "Other fees not found for this course");

    return formatResponse(res, 200, "Other fees fetched successfully for this course", true, otherFees);
};


export const fetchCourseFeeByCourse = async (courseCode: String) => {
    const record = await CourseMetaData.findOne({
        'courseCode': courseCode,
        'fee.semWiseFee.type' : FeeType.EDUCATION
    });

    if (!record) 
        return null;

    const courseFee = record.fee.semWiseFee;
    let feeAmt : any[] = []
    courseFee.forEach((fee) => {
        if(fee.type == FeeType.EDUCATION)
            feeAmt = fee.fees;
    })
    return feeAmt || null;
};

export const fetchOtherFees = async (courseCode : String) => {
    
    const record = await CourseMetaData.findOne({
        'courseCode': courseCode
    });

    if (!record) 
        return null;

    const courseFee = record.fee.semWiseFee;
    let feeAmt : any[] = []

    courseFee.forEach((fee) => {
        if(fee.type == FeeType.BOOKBANK)
            feeAmt = fee.fees;
    })
    
    const bookBankAmt : IFeeItem = {
        type: "BOOKBANK",
        amount: feeAmt[0]
    }

    const yearlyFee = record.fee.yearlyFee || [];
    const oneTimeFee = record.fee.oneTime || [];
    const otherFees = [...yearlyFee, ...oneTimeFee, bookBankAmt];
    // console.log("Other fees : ", otherFees);

    return otherFees;

};
