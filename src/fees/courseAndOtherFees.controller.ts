import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { CourseAndOtherFeesModel } from './courseAndOtherFees.model';
import { Course } from '../config/constants';
import expressAsyncHandler from 'express-async-handler';
import { CourseMetaData } from '../course/models/courseMetadata';
import { formatResponse } from '../utils/formatResponse';

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

    const courseName = req.params.courseName;
    const courseFee = await fetchCourseFeeByCourse(courseName as Course);

    if(!courseFee)
        throw createHttpError(404, "Fee not found for this course");

    return formatResponse(res, 200, "Other fees fetched successfully for this course", true, courseFee);
    
});

export const getOtherFees = async (req: Request, res: Response) => {
    const courseName = req.params.courseName;
    const otherFees = await fetchOtherFees(courseName as Course);

    if(!otherFees)
        throw createHttpError(404, "Other fees not found for this course");

    return formatResponse(res, 200, "Other fees fetched successfully for this course", true, otherFees);
};


export const fetchCourseFeeByCourse = async (courseName: Course) => {
    const record = await CourseMetaData.findOne({
        'courseName': courseName
    });

    if (!record) 
        return null;

    const courseFee = record.fee.semWiseFee;
    // console.log("Course Fee : ", courseFee);
    return courseFee || null;
};

export const fetchOtherFees = async (courseName : Course) => {
    
    const record = await CourseMetaData.findOne({
        'courseName': courseName
    });

    if (!record) 
        return null;
    // console.log("Record is : ", record);
    // console.log("Fees : ", record.fee);

    const yearlyFee = record.fee.yearlyFee || [];
    const oneTimeFee = record.fee.oneTime || [];
    const otherFees = [...yearlyFee, ...oneTimeFee];
    // console.log("Other fees : ", otherFees);

    return otherFees;

};
