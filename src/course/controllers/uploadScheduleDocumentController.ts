import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { MaterialType } from "../../config/constants";
import { formatResponse } from "../../utils/formatResponse";
import { Course } from "../models/course";
import { Response } from "express"
import { uploadToS3 } from "../config/s3Upload";
import { fetchScheduleInformation } from "./scheduleController";

const planConfigMap = {
    lecture: {
        mongoPlanPath: 'lecturePlan',
        planKey: 'lp',
        materialType: MaterialType.LPLAN,
        successMessage: 'Lecture Plan uploaded successfully',
    },
    practical: {
        mongoPlanPath: 'practicalPlan',
        planKey: 'pp',
        materialType: MaterialType.PPLAN,
        successMessage: 'Practical Plan uploaded successfully',
    },
} as const;

export const uploadScheduleDocument = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let { courseId, semesterId, subjectId, instructorId, planId, type } = req.body;
    const file = req.file as Express.Multer.File | undefined;
    const uploadedData = await uploadPlanDocument(courseId, semesterId, subjectId, instructorId, planId, type, file);

    if (req.file) {
        req.file.buffer = null as unknown as Buffer;
    }

    return formatResponse(res, 200, uploadedData.message, true, uploadedData.payload);
});


export const uploadAdditionalResources = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let { courseId, semesterId, subjectId, instructorId } = req.body;
    const file = req.file as Express.Multer.File | undefined;

    courseId = new mongoose.Types.ObjectId(courseId);
    semesterId = new mongoose.Types.ObjectId(semesterId);
    subjectId = new mongoose.Types.ObjectId(subjectId);
    instructorId = new mongoose.Types.ObjectId(instructorId);

    if (!courseId && !semesterId && !subjectId && !instructorId && !file)
        throw createHttpError(400, 'Invalid information to upload the file. Please reverify');


    let fileUrl;

    if (file) {
        fileUrl = await uploadToS3(courseId, semesterId, subjectId, MaterialType.GENERAL, file);
    }

    console.log(fileUrl);

    if (req.file) {
        req.file.buffer = null as unknown as Buffer;
    }

    const updatedData = await Course.findOneAndUpdate(
        {
            _id: courseId,
            "semester._id": semesterId,
            "semester.subjects._id": subjectId,
        },
        {
            $push: {
                "semester.$[sem].subjects.$[subj].schedule.additionalResources": fileUrl,
            },
        },
        {
            new: true,
            arrayFilters: [
                { "sem._id": semesterId },
                { "subj._id": subjectId }
            ],
        }
    );

    if (!updatedData)
        throw createHttpError(404, 'Error occurred saving the document');

    const responsePayload = await fetchScheduleInformation(courseId, semesterId, subjectId, instructorId);

    return formatResponse(res, 200, 'Additional Resource added successfully', true, responsePayload);
})


export const uploadPlanDocument = async (crsId: string, semId: string, subId: string, insId: string, planId: string, planType: MaterialType, file: Express.Multer.File | undefined) => {

    const config = planType === MaterialType.LPLAN ? planConfigMap.lecture : planConfigMap.practical;
    console.log(config);

    console.log(crsId, semId, subId, planId, insId, file);
    if (!crsId && !semId && !subId && !planId && !insId && !file)
        throw createHttpError(400, 'Invalid information to upload file. Please reverify!');

    let fileUrl;

    if (file) {
        fileUrl = await uploadToS3(crsId, semId, subId, planType, file);
    }

    console.log(fileUrl);

    let courseId = new mongoose.Types.ObjectId(crsId);
    let semesterId = new mongoose.Types.ObjectId(semId);
    let subjectId = new mongoose.Types.ObjectId(subId);
    let coursePlanId = new mongoose.Types.ObjectId(planId);


    const updatedData = await Course.findOneAndUpdate(
        {
            _id: courseId,
            [`semester._id`]: semesterId,
            [`semester.subjects._id`]: subjectId,
            [`semester.subjects.schedule.${config!.mongoPlanPath}._id`]: coursePlanId,
        },
        {
            $push: {
                [`semester.$[sem].subjects.$[subj].schedule.${config!.mongoPlanPath}.$[${config!.planKey}].documents`]: fileUrl,
            },
        },
        {
            new: true,
            arrayFilters: [
                { "sem._id": semesterId },
                { "subj._id": subjectId },
                { [`${config!.planKey}._id`]: coursePlanId },
            ],
        }
    );



    if (!updatedData)
        throw createHttpError(404, 'Error occurred saving the document');

    const responsePayload = await fetchScheduleInformation(crsId, semId, subId, insId);

    return {
        message: config!.successMessage,
        payload: responsePayload
    }
};

