// models/CourseDues.ts
import mongoose, { Schema, Document } from 'mongoose';
import { COLLECTION_NAMES } from '../../config/constants';

interface DuesEntry {
    courseYear: string;
    totalDue: number;
    dueStudentCount: number;
}
export interface CourseDues {
    courseCode: string;
    courseName: string;
    academicYear: string;
    dues: DuesEntry[];
    date: Date,
    departmentHODName : string;
    departmentHODEmail : string
}
export interface CourseDuesDocument extends CourseDues, Document { }

const CourseDuesSchema: Schema = new Schema({
    courseCode: { type: String, required: true },
    courseName: { type: String, required: true },
    academicYear: { type: String, required: true },
    dues: [
        {
            courseYear: { type: String, required: true },
            totalDue: { type: Number, default: 0 },
            dueStudentCount: { type: Number, default: 0 }
        }
    ],
    date: { type: Date },
    departmentHODName : { type : String},
    departmentHODEmail : { type : String}
});

export const CourseDues = mongoose.model<CourseDuesDocument>(COLLECTION_NAMES.COURSE_DUES, CourseDuesSchema);
