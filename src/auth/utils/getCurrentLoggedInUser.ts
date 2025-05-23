import { jwtHelper } from "../../utils/jwtHelper";
import { AuthenticatedRequest } from "../validators/authenticatedRequest";

export const getCurrentLoggedInUser = ( req : AuthenticatedRequest ) => {
    const token = req.cookies.token;
    const decoded = jwtHelper.verifyToken(token) as { id: string };
    return decoded.id;
}