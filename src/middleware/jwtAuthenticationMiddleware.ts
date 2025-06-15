import { NextFunction, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import { AuthenticatedRequest, UserPayloadSchema } from '../auth/validators/authenticatedRequest';
import { UserRoles } from '../config/constants';
import { jwtHelper } from '../utils/jwtHelper';

export const authenticate = expressAsyncHandler(
  async (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
    const token = req.cookies?.token;

    if (!token) {
      throw createHttpError(401, 'Unauthorized. Please log in again');
    }
    
    const decoded = jwtHelper.verifyToken(token);
    const parsedUser = UserPayloadSchema.parse(decoded);
    req.data = parsedUser;

    next();
  }
);

export const authorize = (allowedRoles: UserRoles[]) => expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    
    if (!req.data) {
      throw createHttpError(401, 'Unauthorized. Please log in again');
    }

    const { roles } = req.data;
    
    allowedRoles.push(UserRoles.ADMIN);

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      throw createHttpError(403, 'Forbidden: You do not have any assigned roles.');
    }

    const hasPermission = roles.some((role) => allowedRoles.includes(role as UserRoles));

    if (!hasPermission) {
      throw createHttpError(403, 'Forbidden: You are not authorized to access this resource.');
    }

    next();
});
