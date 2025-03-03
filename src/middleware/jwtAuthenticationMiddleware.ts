import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../secrets';

export interface AuthenticatedRequest extends Request {
    data?: any;
}

export const jwtAuthenticationMiddleWare = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const token = req.cookies?.token; 
        if (!token) {
            res.status(401).json({ message: "Unauthorized. Please log in again" });
            return; 
        }

        console.log("Auth Token:", token);

        const decoded = jwt.verify(token, JWT_SECRET as string);
        req.data = decoded; 

        next(); 
    } catch (error) {
        console.error("JWT Verification Error:", error);
        res.status(403).json({ message: "Invalid or expired token" });
        return;
    }
};
