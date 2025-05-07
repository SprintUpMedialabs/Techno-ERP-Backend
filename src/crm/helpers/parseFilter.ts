import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { UserRoles } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { OrderBy, SortableFields } from '../enums/sorting';
import { IAllLeadFilter } from '../types/marketingSpreadsheet';

//We need to add here one for LTC of yellow leads for allowing analytics of yellow leads table on that => createdAt pe kaam kar raha hai ab
export const parseFilter = (req: AuthenticatedRequest) => {
  const {
    startDate,
    endDate,
    startLTCDate,// related to yellow lead table
    endLTCDate,// related to yellow lead table
    leadType = [],
    finalConversionType = [], // related to yellow lead table
    course = [],
    city = [],
    assignedTo = [],
    page = 1,
    limit = 10,
    sortBy = [],
    orderBy = [],
    search = '',
    source = []
  } = req.body;

  const filters: IAllLeadFilter = {
    startDate,
    endDate,
    leadType,
    finalConversionType,
    course,
    city,
    assignedTo,
    startLTCDate,
    endLTCDate,
    source
  };

  const query: any = {};

  if (finalConversionType.length > 0) {
    query.finalConversion = { $in: filters.finalConversionType };
  }

  if (leadType.length > 0) {
    query.leadType = { $in: filters.leadType };
  }

  if (filters.course.length > 0) {
    query.course = { $in: filters.course };
  }

  if (filters.city.length > 0) {
    query.city = { $in: filters.city };
  }

  if (filters.source.length > 0) {
    query.source = { $in: filters.source };
  }

  filters.assignedTo = filters.assignedTo.map(id => new mongoose.Types.ObjectId(id));

  if (
    req.data?.roles.includes(UserRoles.EMPLOYEE_MARKETING) &&
    !req.data?.roles.includes(UserRoles.LEAD_MARKETING) &&
    !req.data?.roles.includes(UserRoles.ADMIN)
  ) {
    query.assignedTo = { $in: [new mongoose.Types.ObjectId(req.data.id)] };
  } else if (
    req.data?.roles.includes(UserRoles.ADMIN) ||
    req.data?.roles.includes(UserRoles.LEAD_MARKETING)
  ) {
    if (filters.assignedTo.length > 0) {
      query.assignedTo = { $in: filters.assignedTo };
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

  if (filters.startLTCDate || filters.endLTCDate) {
    query.createdAt = {};
    if (filters.startLTCDate) {
      query.createdAt.$gte = convertToMongoDate(filters.startLTCDate);
    }
    if (filters.endLTCDate) {
      query.createdAt.$lte = convertToMongoDate(filters.endLTCDate);
    }
  }



  const reversedSortBy = [...sortBy].reverse();
  const reversedOrderBy = [...orderBy].reverse();

  let sort: any = {};

  reversedSortBy.forEach((field, index) => {
    const direction = reversedOrderBy[index] === OrderBy.DESC ? -1 : 1;

    if (field === SortableFields.LTC_DATE) {
      sort['leadTypeModifiedDate'] = direction;
    }
    else {
      sort[field] = direction;
    }
    sort['_id'] = 1;
  });


  return {
    search: search,
    query: query,
    page: page,
    limit: limit,
    sort: sort
  };
};
