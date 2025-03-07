import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../secrets';
import { UserRoles } from '../config/constants';
import { User } from '../auth/models/user';
import { AuthenticatedRequest, UserPayloadSchema } from '../auth/validators/authenticatedRequest';
import logger from '../config/logger';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ message: 'Unauthorized. Please log in again' });
      return;
    }

    // console.log('Auth Token:', token);

    const decoded = jwt.verify(token, JWT_SECRET as string);
    const parsedUser = UserPayloadSchema.parse(decoded);
    req.data = parsedUser;
    console.log('Authentication over!');
    next();
  } catch (error) {
    logger.error('JWT Verification Error:', error);
    res.status(403).json({ message: 'Invalid or expired token' });
    return;
  }
};

export const authorize =
  (allowedRoles: UserRoles[]) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.data) {
        res.status(401).json({ message: 'Unauthorized: Please log in and try again!' });
      }

      const id = req.data?.id;
      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({ message: 'User not found. Please create an account first!' });
      } else {
        const hasPermission = user.roles.some((role) => allowedRoles.includes(role as UserRoles));

        if (!hasPermission) {
          res
            .status(403)
            .json({ message: 'Forbidden: You are not authorized to access this resource.' });
        }

        next();
      }
    } catch (error) {
      logger.error('Error in authorization middleware:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
