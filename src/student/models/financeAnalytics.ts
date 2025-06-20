import mongoose, { Schema } from "mongoose";
import {  ICourseWiseSchema, ICourseYearDetailSchema, IFinanceAnalyticsSchema } from "../validators/financeAnalyticsSchema";
import { COLLECTION_NAMES, CourseYears } from "../../config/constants";

export interface CourseWiseDetails{
    courseYear : string,
    totalCollection : number,
    totalExpectedRevenue : number,
    totalStudents : number
}

export interface CourseWiseInformation{
    courseName : string,
    departmentName : string,
    totalCollection : number,
    totalExpectedRevenue : number,
    totalStudents : number,
    details : CourseWiseDetails[]
}


export interface FinanceAnalytics{
    date : Date,
    academicYear : string,
    totalCollection : number,
    totalExpectedRevenue : number,
    totalStudents : number,
    courseWise : CourseWiseInformation[]
}

export interface IFinanceAnalyticsDocument extends IFinanceAnalyticsSchema, Document {}
export interface ICourseWiseDocument extends ICourseWiseSchema, Document{}
export interface ICourseYearDetailDocument extends ICourseYearDetailSchema, Document{}

const CourseWiseDetailSchema = new Schema<ICourseYearDetailDocument>({
    courseYear : {
        type : String,
        // enum : Object.values(CourseYears)
    },
    totalCollection : {
        type : Number,
        default : 0
    },
    totalExpectedRevenue : {
        type : Number,
        default : 0
    },
    totalStudents : {
        type : Number,
        default : 0
    }
})

const CourseWiseSchema = new Schema<ICourseWiseDocument>({
    courseName : {
        type : String
    },
    departmentName : {
        type : String
    },
    totalCollection : {
        type : Number,
        default : 0
    },
    totalExpectedRevenue : {
        type : Number,
        default : 0
    },  
    totalStudents : {
        type : Number,
        default : 0
    },
    details : {
        type : [CourseWiseDetailSchema],
        default : []
    }
})

const FinanceAnalyticsSchema  = new Schema<IFinanceAnalyticsDocument>({
    date : {
        type : Date
    },
    academicYear : {
        type : String
    },
    totalCollection : {
        type : Number,
        default : 0
    },
    totalStudents : {
        type : Number,
        default : 0
    },
    totalExpectedRevenue : {
        type : Number,
        default : 0
    },
    courseWise : {
        type : [CourseWiseSchema],
        default : []
    }
})


export const FinanceAnalytics = mongoose.model<IFinanceAnalyticsDocument>(COLLECTION_NAMES.FINANCE_ANALYTICS, FinanceAnalyticsSchema);