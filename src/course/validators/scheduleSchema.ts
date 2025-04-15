import { z } from "zod";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { LectureConfirmation } from "../../config/constants";

export const baseLectureSchema = z.object({
    unit : z.number().nonnegative({ message : "Unit Number is required "}),
    lectureNumber : z.number().nonnegative({ message : "Lecture Number is required "}),
    topicName : z.number(),
    instructor : objectIdSchema,
    plannedDate : requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ),
    actualDate : requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ).optional(),
    classStrength: z.number().optional(),
    attendance: z.number().optional(),
    absent: z.number().optional(),
    confirmation: z.nativeEnum(LectureConfirmation).default(LectureConfirmation.TO_BE_DONE),
    remarks: z.string().optional(),
    documents: z.array(z.string().url()).optional()
})

export const lecturePlanSchema = baseLectureSchema.superRefine(({ attendance, classStrength }, ctx) => {
    if ( attendance !== undefined && classStrength !== undefined && attendance > classStrength) {
        ctx.addIssue({
        path: ["attendance"],
        message: "Attendance cannot exceed class strength",
        code: z.ZodIssueCode.custom,
      });
    }
});


export const practicalPlanSchema = lecturePlanSchema;


export const scheduleSchema = z.object({
    lecturePlan: z.array(lecturePlanSchema),
    practicalPlan: z.array(practicalPlanSchema),
    additionalResources: z.array(z.string().url()).optional()
});

export const createLecturePlanSchema = baseLectureSchema.extend({
    courseId : objectIdSchema,
    semesterId : objectIdSchema,
    subjectId : objectIdSchema,
    instructorId : objectIdSchema
});

export const createPracticalPlanSchema = createLecturePlanSchema;

export type ILecturePlanSchema = z.infer<typeof lecturePlanSchema>;
export type ICreateLecturePlanSchema = z.infer<typeof createLecturePlanSchema>;
export type IPracticalPlanSchema = z.infer<typeof practicalPlanSchema>;
export type ICreatePracticalPlanSchema = z.infer<typeof createPracticalPlanSchema>;
export type IScheduleSchema = z.infer<typeof scheduleSchema>;  