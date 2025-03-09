import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { FinalConversionType, LeadType, UserRoles } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { IAllLeadFilter } from '../types/marketingSpreadsheet';

export const parseFilter = (req: AuthenticatedRequest) => {
  const {
    startDate,
    endDate,
    leadType = [],
    course = [],
    location = [],
    assignedTo = [],
    page = 1,
    limit = 10,
    search = ''
  } = req.body;

  const filters: IAllLeadFilter = {
    startDate,
    endDate,
    leadType,
    course,
    location,
    assignedTo
  };

  const query: any = {};

  if (filters.leadType.length > 0) {
    const finalConversionTypes = Object.values(FinalConversionType);
    const leadTypes = Object.values(LeadType);

    const isFinalConversionType = filters.leadType.some((type) =>
      finalConversionTypes.includes(type as FinalConversionType)
    );

    if (isFinalConversionType) {
      query.finalConversion = { $in: filters.leadType };
    } else {
      query.leadType = { $in: filters.leadType };
    }
  }

  if (filters.course.length > 0) {
    query.course = { $in: filters.course };
  }

  if (filters.location.length > 0) {
    query.location = { $in: filters.location };
  }

  // if (filters.assignedTo.length > 0) {
  //   if (
  //     req.data?.roles.includes(UserRoles.EMPLOYEE_MARKETING) &&
  //     !req.data?.roles.includes(UserRoles.LEAD_MARKETING)
  //   ) {
  //     console.log("Marketing emp id : ",req.data.id);
  //     filters.assignedTo = [req.data.id];
  //   }
  //   query.assignedTo = { $in: filters.assignedTo };
  // }

  if (
    req.data?.roles.includes(UserRoles.EMPLOYEE_MARKETING) &&
    !req.data?.roles.includes(UserRoles.LEAD_MARKETING) &&
    !req.data?.roles.includes(UserRoles.ADMIN)
  ) {
    // console.log("A marketing employee!");
    query.assignedTo = { $in: [req.data.id] };
  } else if (
    req.data?.roles.includes(UserRoles.ADMIN) ||
    req.data?.roles.includes(UserRoles.LEAD_MARKETING)
  ) {
    if (filters.assignedTo.length > 0) {
      query.assignedTo = { $in: filters.assignedTo };
    } else {
      query.assignedTo = { $exists: true };
    }
  }

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) {
      query.date.$gte = convertToMongoDate(filters.startDate);
    }
    if (filters.endDate) {
      query.date.$lte = convertToMongoDate(filters.endDate);
    }
  }

  return {
    search: search,
    query: query,
    page: page,
    limit: limit
  };
};
