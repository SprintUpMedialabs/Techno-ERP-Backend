import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import PrismaRepo from '../../config/prismaRepo';
import { User } from '@prisma/client';
import { userSchema } from '../validators/user';
import { RegisterUser } from '../types/user.type';

const prisma = PrismaRepo.getClient;
const register = expressAsyncHandler(async (req: Request, res: Response) => {
  const user: RegisterUser = req.body;
  userSchema.safeParseAsync(user);
});

const verifyOtp = expressAsyncHandler(
  async (req: Request, res: Response) => {}
);
