import { Types } from 'mongoose';
import { Course, FinalConversionType, LeadType, Locations } from '../../config/constants';
import { Gender } from 'aws-sdk/clients/polly';

export interface IMarketingSpreadsheetProcessReport {
  rowsToBeProcessed: number;
  actullyProcessedRows: number;
  rowsFailed: number;
  
  duplicateRowIds: number[];
  phoneNumberAndNameEmpty: number[];
  assignedToNotFound: number[];
  emptyRows: number[];
  unauthorizedAssignedTo: number[];
  invalidPhoneNumber: number[];
  otherIssue: { rowId: number; issue: string }[];
}

// Interface for Filtering Leads
export interface IAllLeadFilter {
  course: Course[]; // Accepts multiple course values as an array
  city: Locations[]; // Array for multiple locations
  assignedTo: Types.ObjectId[]; // Array for multiple assigned users | TODO: need to test this 
  startDate?: string; // Date range start
  endDate?: string; // Date range end
  leadType: LeadType[]; // Lead Type Enum
  finalConversionType: FinalConversionType[];
  startLTCDate?: string;
  endLTCDate?: string;
  source: string[];
}

export interface IAdminAnalyticsFilter {
  city: Locations[]; // Array for multiple locations
  assignedTo: Types.ObjectId[]; // Array for multiple assigned users | TODO: need to test this
  startDate?: string; // Date range start
  endDate?: string; // Date range end
  source?: string[];
  gender: Gender[];
}
