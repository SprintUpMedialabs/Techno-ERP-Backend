import { Schema, model, Document } from 'mongoose';
import { COLLECTION_NAMES } from '../../config/constants';

export enum CourseType {
  UG = 'UG',
  PG = 'PG',
  DIPLOMA = 'Diploma',
}

export enum CourseStatus {
  RUNNING = 'Running',
  COMPLETED = 'Completed',
  INACTIVE = 'Inactive',
}

export interface ICourseMetaDataSchema {
  departmentName: string;
  fullCourseName: string;
  courseName: string;
  courseCode: string;
  collegeName: string;
  type: CourseType;
  affiliation: string;
  status: CourseStatus;
  courseDuration: number;
  totalSemesters: number;
  documentType: string[];
}

export interface ICourseMetaDataDocument extends ICourseMetaDataSchema, Document {}

export const courseModelSchema = new Schema<ICourseMetaDataDocument>({
  departmentName: {
    type: String,
    required: [true, 'Department name is required'],
  },
  fullCourseName: {
    type: String,
    required: [true, 'Full course name is required'],
  },
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
  },
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
  },
  collegeName: {
    type: String,
    required: [true, 'College name is required'],
  },
  type: {
    type: String,
    enum: Object.values(CourseType),
    required: [true, 'Course type is required'],
  },
  affiliation: {
    type: String,
    required: [true, 'Affiliation is required'],
  },
  status: {
    type: String,
    enum: Object.values(CourseStatus),
    required: [true, 'Status is required'],
  },
  courseDuration: {
    type: Number,
    required: [true, 'Course duration is required'],
    min: [1, 'Course duration must be at least 1 year'],
  },
  totalSemesters: {
    type: Number,
    required: [true, 'Total semesters are required'],
    min: [1, 'There must be at least 1 semester'],
  },
  documentType: {
    type: [String],
    default: [],
  },
}, { timestamps: true });


const transformDates = (_: any, ret: any) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  };
  
  courseModelSchema.set('toJSON', { transform: transformDates });
  courseModelSchema.set('toObject', { transform: transformDates });
  
  export const CourseMetaData = model<ICourseMetaDataDocument>(COLLECTION_NAMES.COURSE_METADATA, courseModelSchema);