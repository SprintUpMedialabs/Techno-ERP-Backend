import createHttpError from "http-errors";
import mongoose from "mongoose";
import { CourseMaterialType } from "../../config/constants";
import { deleteFromS3 } from "../config/s3Delete";
import { Course } from "../models/course";
import { planConfigMap } from "../controllers/scheduleController";

export const deleteFromS3AndDB = async (crsId: string, semId: string, subId: string, plnId: string | undefined, type: CourseMaterialType | undefined, documentUrl: string) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let courseId = new mongoose.Types.ObjectId(crsId);
        let semesterId = new mongoose.Types.ObjectId(semId);
        let subjectId = new mongoose.Types.ObjectId(subId);
        let planId = plnId ? new mongoose.Types.ObjectId(plnId) : undefined;

        const baseFilter = {
            _id: courseId,
            "semester._id": semesterId,
            "semester.subjects._id": subjectId
        };

        const updateOperation: Record<string, any> = {};

        if (planId) {
            const config = type === CourseMaterialType.LPLAN ? planConfigMap.lecture : planConfigMap.practical;
            const path = `semester.$[sem].subjects.$[subj].schedule.${config.mongoPlanPath}.$[plan].documents`;

            updateOperation.$pull = {
                [path]: documentUrl
            };

            await Course.updateOne(
                baseFilter,
                updateOperation,
                {
                    session,
                    arrayFilters: [
                        { "sem._id": semesterId },
                        { "subj._id": subjectId },
                        { "plan._id": planId }
                    ]
                }
            );
        }
        else {
            const path = `semester.$[sem].subjects.$[subj].schedule.additionalResources`;

            updateOperation.$pull = {
                [path]: documentUrl
            };

            await Course.updateOne(
                baseFilter,
                updateOperation,
                {
                    session,
                    arrayFilters: [
                        { "sem._id": semesterId },
                        { "subj._id": subjectId }
                    ]
                }
            );
        }

        await session.commitTransaction();
        console.log("Removed the URL successfully from DB");
        session.endSession();

        await deleteFromS3(documentUrl);
        console.log("Deleted the file successfully from AWS");
    }
    catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        throw createHttpError(404, error.message);
    }
    return;
};
