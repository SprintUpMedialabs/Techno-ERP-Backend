import { z } from "zod";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";

export const scheduleSchema = z.object({
    lectureNumber: z.number().min(1, "Lecture number must be greater than 0"),
    topicName: z.string().min(3, "Topic name should be at least 3 characters long"),
    description: z.string().max(500, "Description should not exceed 500 characters").optional(),
    plannedDate: requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
      ),
    dateOfLecture: requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
      ),
    confirmation: z.boolean(),
    remarks: z.string().max(200, "Remarks should not exceed 200 characters").optional(),
});


export const scheduleRequestSchema = scheduleSchema.extend({
    subjectId : objectIdSchema
})

export const scheduleUpdateSchema = scheduleSchema.extend({
    scheduleId : objectIdSchema
})

export type IScheduleSchema = z.infer<typeof scheduleSchema>;
export type IScheduleRequestSchema = z.infer<typeof scheduleRequestSchema>;
export type IScheduleUpdateSchema = z.infer<typeof scheduleUpdateSchema>;