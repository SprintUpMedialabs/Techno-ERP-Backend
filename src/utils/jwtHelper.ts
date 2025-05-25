import createHttpError from 'http-errors';
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET, STUDENT_JWT_SECRET } from '../secrets';

const createJwtHelper = (secret: string) => {
  return {
    createToken: (payload: object, options: SignOptions = {expiresIn: '15d'}): string => {
      return jwt.sign(payload, secret, options);
    },

    verifyToken: (token: string): JwtPayload => {
      try {
        return jwt.verify(token, secret) as JwtPayload;
      } catch {
        throw createHttpError(400, 'Invalid token');
      }
    },

    decodeToken: (token: string): JwtPayload => {
      try {
        return jwt.decode(token) as JwtPayload;
      } catch {
        throw createHttpError(500, 'Invalid token');
      }
    },
  };
};

export const jwtHelper = createJwtHelper(JWT_SECRET);
export const studentJwtHelper = createJwtHelper(STUDENT_JWT_SECRET);
