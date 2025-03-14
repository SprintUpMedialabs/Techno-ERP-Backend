import { z } from "zod";
import { contactNumberSchema, objectIdSchema, requestDateSchema } from "../../validators/commonSchema"; // Import the date validation schema
import { AdmissionReference, Category, Course } from "../../config/constants";


export const academicDetailSchema = z.object({
    academicDetails: z.enum(["10th", "12th", "Graduation", "Others"]), // Only allows fixed values
    schoolCollegeName: z.string().min(1, "School/College Name is required"),
    universityBoardName: z.string().min(1, "University/Board Name is required"),
    passingYear: z.number().int().min(1900).max(new Date().getFullYear()).refine((year) => year.toString().length === 4, {
        message: "Passing Year must be a valid 4-digit year",
    }),
    percentageObtained: z.number().min(0, "Percentage must be at least 0").max(100, "Percentage cannot exceed 100"),
    subjects: z.array(z.string().min(1, "Subject name is required")).nonempty("Subjects cannot be empty"),
});

// Array schema
export const academicDetailsArraySchema = z.array(academicDetailSchema);

export const enquiryRequestSchema = z.object({
    studentName: z.string().min(1, "Student Name is required"),
    dateOfBirth: requestDateSchema,
    studentPhoneNumber: contactNumberSchema,
    fatherName: z.string().min(1, "Father's Name is required"),
    fatherPhoneNumber: contactNumberSchema,
    fatherOccupation: z.string().min(1, "Father occupation is required"),
    motherName: z.string().min(1, "Mother's Name is required"),
    motherPhoneNumber: contactNumberSchema,
    motherOccupation: z.string().min(1, "Mother occupation is required"),
    category: z.nativeEnum(Category),
    address: z.string().min(5, "Address is required"),
    emailId: z.string().email("Invalid email format"),
    reference: z.nativeEnum(AdmissionReference),
    course: z.nativeEnum(Course),
    counsellor: z.union([objectIdSchema, z.enum(["other"])]),
    remarks: z.string().optional(),
    academicDetails: academicDetailsArraySchema.optional(),
}).strict();

export type IEnquiryRequestSchema = z.infer<typeof enquiryRequestSchema>;
export type IAcademicDetailSchema = z.infer<typeof academicDetailSchema>;