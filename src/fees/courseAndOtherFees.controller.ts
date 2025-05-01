import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { CourseAndOtherFeesModel } from './courseAndOtherFees.model';
import { Course } from '../config/constants';

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

export const getCourseFeeByCourseName = async (req: Request, res: Response) => {

    const courseName = req.params.courseName;
    const courseFee = await fetchCourseFeeByCourse(courseName as Course);

    if (!courseFee) {
        throw createHttpError(404, 'Course fee not found');
    }

    res.status(200).json(courseFee);

};

export const getOtherFees = async (req: Request, res: Response) => {
    const otherFees = await fetchOtherFees();
    res.status(200).json(otherFees);
};

// ✅ Reusable function
export const fetchCourseFeeByCourse = async (courseName: Course) => {
    const record = await CourseAndOtherFeesModel.findOne({
        'courseFees.course': courseName
    });

    if (!record) return null;

    const courseFee = record.courseFees.find(c => c.course === courseName);
    return courseFee || null;
};

export const fetchOtherFees = async () => {
    const record = await CourseAndOtherFeesModel.findOne();
    return record?.otherFees || [];
};
