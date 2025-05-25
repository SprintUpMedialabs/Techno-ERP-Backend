import { z } from "zod";


export const loginRequestSchema = z.object({
    universityId: z.string(),
    password: z
        .string()
        .regex(
            /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
            'Password must be in XX/XX/XXXX format'
        ),
});

export type IStudentLoginRequest = z.infer<typeof loginRequestSchema>;