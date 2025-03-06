import createHttpError from 'http-errors';
import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Generate a JWT token
 * @param payload - Data to be stored in the token
 * @param expiresIn - Expiry time (default: 1 hour)
 * @returns Signed JWT token
 */

// TODO: need to fix this issue
export const createToken = (payload: object, expiresIn = '1h'): string => {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
};

/**
 * Verify a JWT token
 * @param token - The token to verify
 * @returns Decoded token payload if valid, throws error if invalid
 */
export const verifyToken = (token: string): object | null => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET!) as object;
    } catch (error: any) {
        throw createHttpError(400, "Invalid token");
    }
};

/**
 * Decode a JWT token (Does not verify signature)
 * @param token - The token to decode
 * @returns Decoded token payload or null if invalid
 */
export const decodeToken = (token: string): object | null => {
    try {
        return jwt.decode(token) as object;
    } catch (error: any) {
        throw createHttpError(500, "Internal Server Error."); // TODO: we may need to change this in future
    }
};
