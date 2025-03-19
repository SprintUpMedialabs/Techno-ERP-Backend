import expressAsyncHandler from 'express-async-handler';
import { Response } from 'express';
import { User } from '../models/user';
import { AuthenticatedRequest } from '../validators/authenticatedRequest';
import logger from '../../config/logger';
import createHttpError from 'http-errors';
import { roleSchema } from '../../validators/commonSchema';
import { ModuleNames, UserRoles } from '../../config/constants';
import { dropdownSchema } from '../validators/dropdownSchema';
import { decodeToken } from '../../utils/jwtHelper';
import { formatName } from '../../utils/formatName';

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

export const getUserList = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { moduleName } = req.query;

  const id = req.data?.id;
  const roles = req.data?.roles!;

  const validation = dropdownSchema.safeParse({ roles, moduleName });
  if (!validation.success) {
    throw createHttpError(400, "Invalid role or module name");
  }

  let users;

  if (moduleName === ModuleNames.MARKETING) {
    // If the user is ADMIN or LEAD_MARKETING (and not only marketing employee)
    if (roles.includes(UserRoles.ADMIN) || roles.includes(UserRoles.LEAD_MARKETING)) {
      users = await User.find({ roles: UserRoles.EMPLOYEE_MARKETING });
    }
    // If the user is only a MARKETING_EMPLOYEE
    else if (roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
      users = await User.findById(id);
      users = [users];
    }

    if (users) {
      const formattedUsers = users.map((user) => ({
        _id: user?._id,
        name: formatName(user?.firstName, user?.lastName),
        email: user?.email
      }));
      res.status(200).json({ user: formattedUsers });
    }
  }
});

