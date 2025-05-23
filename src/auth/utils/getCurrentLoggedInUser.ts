import { AuthenticatedRequest } from "../validators/authenticatedRequest";
import { studentJwtHelper } from "../../utils/jwtHelper";

export const getCurrentLoggedInUser = ( req : AuthenticatedRequest ) => {
    const token = req.cookies.token;
    const decoded = studentJwtHelper.verifyToken(token) as { id: string };
    return decoded.id;
}