import { verifyToken } from "../../utils/jwtHelper";
import { AuthenticatedRequest } from "../validators/authenticatedRequest";

export const getCurrentLoggedInUser = ( req : AuthenticatedRequest ) => {
    const token = req.cookies.token;
    const decoded = verifyToken(token) as { id: string };
    return decoded.id;
}