import * as z from "zod";
import { ModuleNames, UserRoles } from "../../config/constants";
export const dropdownSchema = z.object({
    role : z.nativeEnum(UserRoles),
    moduleName : z.nativeEnum(ModuleNames)
})