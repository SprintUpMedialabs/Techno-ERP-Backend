import { z } from "zod";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { LectureConfirmation, CourseMaterialType } from "../../config/constants";

export const baseLectureSchema = z.object({
    unit : z.number().nonnegative({ message : "Unit Number is required "}),
    lectureNumber : z.number().nonnegative({ message : "Lecture Number is required "}),
    topicName : z.string(),
    instructor : objectIdSchema.optional(),
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

export const planSchema = baseLectureSchema.superRefine(({ attendance, classStrength }, ctx) => {
    if ( attendance !== undefined && classStrength !== undefined && attendance > classStrength) {
        ctx.addIssue({
        path: ["attendance"],
        message: "Attendance cannot exceed class strength",
        code: z.ZodIssueCode.custom,
      });
    }
});

export const scheduleSchema = z.object({
    lecturePlan: z.array(planSchema),
    practicalPlan: z.array(planSchema),
    additionalResources: z.array(z.string().url()).optional()
});

export const createPlanSchema = baseLectureSchema.extend({
    type : z.nativeEnum(CourseMaterialType),
    courseId : objectIdSchema,
    semesterId : objectIdSchema,
    subjectId : objectIdSchema,
    instructorId : objectIdSchema
});

export const updatePlanSchema = z.object({
    type : z.nativeEnum(CourseMaterialType),
    courseId : objectIdSchema,
    semesterId : objectIdSchema,
    subjectId : objectIdSchema,
    instructorId : objectIdSchema,
    data : z.array(baseLectureSchema.omit({ documents : true }).superRefine(({ attendance, classStrength }, ctx) => {
        if ( attendance !== undefined && classStrength !== undefined && attendance > classStrength) {
            ctx.addIssue({
            path: ["attendance"],
            message: "Attendance cannot exceed class strength",
            code: z.ZodIssueCode.custom,
          });
        }
    }))
});

export const deletePlanSchema = z.object({
    type : z.nativeEnum(CourseMaterialType),
    courseId : objectIdSchema,
    semesterId : objectIdSchema,
    subjectId : objectIdSchema,
    instructorId : objectIdSchema,
    planId : objectIdSchema
})

export const deleteFileUsingUrlSchema = z.object({
    type : z.nativeEnum(CourseMaterialType).optional(),
    courseId : objectIdSchema,
    semesterId : objectIdSchema,
    subjectId : objectIdSchema,
    planId : objectIdSchema.optional(),
    documentUrl : z.string()
})

export type IPlanSchema = z.infer<typeof planSchema>;
export type ICreatePlanSchema = z.infer<typeof createPlanSchema>;
export type IUpdatePlanSchema = z.infer<typeof updatePlanSchema>;
export type IDeletePlanSchema = z.infer<typeof deletePlanSchema>;
export type IScheduleSchema = z.infer<typeof scheduleSchema>;  
export type IDeleteFileSchema = z.infer<typeof deleteFileUsingUrlSchema>;