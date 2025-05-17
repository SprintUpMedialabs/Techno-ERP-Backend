import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";
import { Actions } from "../../config/constants";

export const marketingFollowUpSchema = z.object({
    currentLoggedInUser : objectIdSchema,
    leadId : objectIdSchema,
    action : z.nativeEnum(Actions)
})

export type IMarketingFollowUpSchema = z.infer<typeof marketingFollowUpSchema>;