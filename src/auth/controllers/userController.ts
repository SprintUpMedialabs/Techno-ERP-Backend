import expressAsyncHandler from 'express-async-handler';
import { Response } from 'express';
import { User } from '../models/user';
import { AuthenticatedRequest } from '../validators/authenticatedRequest';
import logger from '../../config/logger';

export const userProfile = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const decodedData = req.data;

  if (!decodedData) {
    res.status(404).json({ message: "Profile couldn't be displayed." });
    return;
  }

  const { id, roles } = decodedData;
  // console.log('User ID:', id, 'Roles:', roles);

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({
      message: 'User profile retrieved successfully.',
      userData: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    logger.error('Error in userProfile:', error);
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});
