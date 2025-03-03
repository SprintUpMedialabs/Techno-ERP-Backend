import expressAsyncHandler from 'express-async-handler';
import PrismaRepo from '../../config/prismaRepo';
import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/jwtAuthenticationMiddleware';

const prisma = PrismaRepo.getClient;

export const userProfile = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const decodedData = req.data;
  console.log(decodedData);
  if (!decodedData) {
    res.status(404).json({ message: "Profile couldn't been displayed" });
  }
  const { id, roles } = decodedData;
  console.log('User ID:', id, 'Roles:', roles);
  const user = await prisma.user.findFirst({ where: { id: id } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
  } 
  else {
    res.status(200).json({
      message: 'User profile retrieved successfully',
      userData: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        roles: user.roles
      }
    });
  }
});
