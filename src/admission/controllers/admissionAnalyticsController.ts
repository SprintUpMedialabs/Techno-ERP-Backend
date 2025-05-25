
import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import moment from 'moment-timezone';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { AdmissionAggregationType, PipelineName } from '../../config/constants';
import { CourseMetaData } from '../../course/models/courseMetadata';
import { formatResponse } from '../../utils/formatResponse';
import { AdmissionAnalyticsModel } from '../models/admissionAnalytics';
import { retryMechanism } from '../../config/retryMechanism';
import { createPipeline } from '../../pipline/controller';
import mongoose from 'mongoose';

// DACHECK: This function should be robust enough so that if it get failed then it retries by its own until it get success and also should send mails upon 5th attempt failure
// TEST: this function is going to be tested with the time
export const incrementAdmissionAnalytics = async (courseCode: string) => {
    const now = moment().tz('Asia/Kolkata');

    const updates = [
        {
            type: AdmissionAggregationType.DATE_WISE,
            date: now.clone().startOf('day').toDate(), // exact IST date
            courseCode: 'ALL',
        },
        {
            type: AdmissionAggregationType.MONTH_WISE,
            date: now.clone().startOf('month').toDate(), // 01/MM/YYYY
            courseCode: 'ALL',
        },
        {
            type: AdmissionAggregationType.MONTH_AND_COURSE_WISE,
            date: now.clone().startOf('month').toDate(), // 01/MM/YYYY
            courseCode: courseCode,
        },
        {
            type: AdmissionAggregationType.YEAR_AND_COURSE_WISE,
            date: now.clone().startOf('year').toDate(), // 01/01/YYYY
            courseCode: courseCode,
        },
    ];

    const updatePromises = updates.map(({ type, date, courseCode }) =>
        AdmissionAnalyticsModel.findOneAndUpdate(
            { type, date, courseCode },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
        )
    );

    await Promise.all(updatePromises);
};

export const assignBaseValueToAdmissionAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type } = req.query;
    const courseList = await CourseMetaData.find().select('courseCode courseName');
    const courseCodeList = courseList.map(course => ({ courseCode: course.courseCode, courseName: course.courseName }));
    const now = moment().tz('Asia/Kolkata');
    if (!Object.values(AdmissionAggregationType).includes(type as AdmissionAggregationType)) {
        throw createHttpError(400, 'Invalid type');
    }
    const pipelineId = await createPipeline(PipelineName.ADMISSION_ANALYTICS_BASE_VALUE_ASSIGNMENT);
    if (!pipelineId) throw createHttpError(400, "Pipeline creation failed");

    const session = await mongoose.startSession();
    session.startTransaction();

    retryMechanism(async (session) => {
        if (type === AdmissionAggregationType.DATE_WISE) {
            await AdmissionAnalyticsModel.create({
                type,
                date: now.clone().startOf('day').toDate(),
                courseCode: 'ALL',
                count: 0,
            }, { session });
        } else if (type === AdmissionAggregationType.MONTH_WISE) {
            await AdmissionAnalyticsModel.create({
                type,
                date: now.clone().startOf('month').toDate(),
                courseCode: 'ALL',
                count: 0,
            }, { session });
        } else if (type === AdmissionAggregationType.MONTH_AND_COURSE_WISE) {
            await Promise.all(courseCodeList.map(async course =>
                await AdmissionAnalyticsModel.create({
                    type,
                    date: now.clone().startOf('month').toDate(),
                    courseCode: course.courseCode,
                    count: 0,
                }, { session })
            ));
        } else if (type === AdmissionAggregationType.YEAR_AND_COURSE_WISE) {
            await Promise.all(courseCodeList.map(async course =>
                await AdmissionAnalyticsModel.create({
                    type,
                    date: now.clone().startOf('year').toDate(),
                    courseCode: course.courseCode,
                    count: 0,
                }, { session })
            ));
        }
    }, `Base value assignment failed`, `Base value assignment failed for type ${type}`, pipelineId, PipelineName.ADMISSION_ANALYTICS_BASE_VALUE_ASSIGNMENT, 5, 500);

    formatResponse(res, 200, 'Base value assigned successfully', true, null);
});


const getStartOfDateByType = (type: AdmissionAggregationType, dateStr: string): moment.Moment => {
    const format = 'DD-MM-YYYY'; // Corrected format
    const baseMoment = moment.tz(dateStr, format, 'Asia/Kolkata');

    switch (type) {
        case AdmissionAggregationType.MONTH_WISE:
        case AdmissionAggregationType.MONTH_AND_COURSE_WISE:
            return baseMoment.startOf('month');
        case AdmissionAggregationType.YEAR_AND_COURSE_WISE:
            return baseMoment.startOf('year');
        default:
            return baseMoment.startOf('day');
    }
};

// TEST: this function is going to be tested with the time
export const getAdmissionStats = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, date } = req.query;

    if (!type || !date) {
        throw createHttpError(400, 'type and date are required');
    }

    const baseDate = getStartOfDateByType(type as AdmissionAggregationType, date as string);
    let queryFilters: any[] = [];

    if (type === AdmissionAggregationType.DATE_WISE) {
        for (let i = 0; i < 5; i++) {
            const d = baseDate.clone().subtract(i, 'days');
            if (d.month() === baseDate.month()) {
                queryFilters.push({ type, date: d.toDate() });
            }
        }
    } else if (type === AdmissionAggregationType.MONTH_WISE) {
        for (let i = 0; i < 5; i++) {
            const d = baseDate.clone().subtract(i, 'months');
            if (d.year() === baseDate.year()) {
                queryFilters.push({ type, date: d.startOf('month').toDate() });
            }
        }
    } else if (type === AdmissionAggregationType.YEAR_AND_COURSE_WISE) {
        for (let i = 0; i < 5; i++) {
            const d = baseDate.clone().subtract(i, 'years');
            queryFilters.push({ type, date: d.startOf('year').toDate(), courseCode: { $ne: 'ALL' } });
        }
    } else if (type === AdmissionAggregationType.MONTH_AND_COURSE_WISE) {
        queryFilters.push({ type, date: baseDate.toDate(), courseCode: { $ne: 'ALL' } });
    } else {
        throw createHttpError(400, 'Invalid type');
    }

    const data = await AdmissionAnalyticsModel.find({ $or: queryFilters });

    if (type === AdmissionAggregationType.MONTH_AND_COURSE_WISE || type === AdmissionAggregationType.YEAR_AND_COURSE_WISE) {
        // Group data by date
        const groupedData: Record<string, { date: string, courseWise: { count: number; courseCode: string }[] }> = {};

        data.forEach(item => {
            const dateStr = moment(item.date).tz('Asia/Kolkata').format('DD/MM/YYYY');

            if (!groupedData[dateStr]) {
                groupedData[dateStr] = { date: dateStr, courseWise: [] };
            }

            groupedData[dateStr].courseWise.push({
                count: item.count,
                courseCode: item.courseCode,
            });
        });

        const formattedData = Object.values(groupedData);

        if (type === AdmissionAggregationType.MONTH_AND_COURSE_WISE) {
            formatResponse(res, 200, 'Admission stats fetched successfully', true, { monthWise: formattedData });
        } else {
            formatResponse(res, 200, 'Admission stats fetched successfully', true, { yearWise: formattedData });
        }
    } else {
        // For other types, keep existing format
        formatResponse(res, 200, 'Admission stats fetched successfully', true, data);
    }
});