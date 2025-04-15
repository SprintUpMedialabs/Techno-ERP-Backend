import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import { ModuleNames, UserRoles } from '../../config/constants';
import { formatName } from '../../utils/formatName';
import { formatResponse } from '../../utils/formatResponse';
import { roleSchema } from '../../validators/commonSchema';
import { User } from '../models/user';
import { AuthenticatedRequest } from '../validators/authenticatedRequest';
import { dropdownSchema } from '../validators/dropdownSchema';

export const userProfile = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const decodedData = req.data;

  if (!decodedData) {
    throw createHttpError(404, 'Profile could not be fetched');

  }

  const { id } = decodedData;

  const user = await User.findById(id);
  
  return formatResponse(res, 200, 'Profile retrieved successfully', true, {
    userData: {
      id: user?._id,
      name: `${user?.firstName} ${user?.lastName}`,
      email: user?.email,
      roles: user?.roles
    }
  })
});



export const getUserByRole = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const { role } = req.query;

  // Validate role using Zod
  const parsedRole = roleSchema.safeParse(role);

  if (!parsedRole.success) {
    throw createHttpError(400, 'Invalid role provided');
  }

  // Fetch users and project only required fields
  const users = await User.find({ roles: parsedRole.data }).select("_id firstName lastName email");

  // Transform the response to include only required fields
  const formattedUsers = users.map(user => ({
    id: user._id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email
  }));

  return formatResponse(res, 200, 'Fetching successful', true, formattedUsers)

});

export const fetchDropdownsBasedOnPage = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { moduleName, role } = req.query;
  const id = req.data?.id;
  const roles = req.data?.roles!;

  const validation = dropdownSchema.safeParse({ role, moduleName });
  if (!validation.success) {
    throw createHttpError(400, "Invalid role or module name");
  }

  let users;

  if (moduleName === ModuleNames.MARKETING) {
    // If the user is ADMIN or LEAD_MARKETING (and not only marketing employee)
    if (roles.includes(UserRoles.ADMIN) || roles.includes(UserRoles.LEAD_MARKETING)) {
      users = await User.find({ roles: role });
    }
    // If the user is only a MARKETING_EMPLOYEE
    else if (roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
      users = await User.findOne({ _id: id });
      users = [users];
    }
    if (users) {
      const formattedUsers = users.map((user) => ({
        _id: user?._id,
        name: formatName(user?.firstName ?? '', user?.lastName ?? ''),
        email: user?.email
      }));
      return formatResponse(res, 200, 'Fetching successful', true, formattedUsers)
    }
  } else if (moduleName === ModuleNames.ADMISSION || moduleName === ModuleNames.COURSE) {
    users = await User.find({ roles: role });
    if (users) {
      const formattedUsers = users.map((user) => ({
        _id: user?._id,
        name: formatName(user?.firstName ?? '', user?.lastName ?? ''),
        email: user?.email
      }));
      return formatResponse(res, 200, 'Fetching successful', true, formattedUsers)
    }
  } else {
    throw createHttpError(400, "Invalid module name");
  }
});