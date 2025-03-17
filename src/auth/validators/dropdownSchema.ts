import * as z from "zod";
import { ModuleNames, UserRoles } from "../../config/constants";
export const dropdownSchema = z.object({
    roles : z.array(z.nativeEnum(UserRoles)),
    moduleName : z.nativeEnum(ModuleNames)
})