import { CourseType, FinalConversionType, LeadType } from '../../config/constants';

export interface IMarketingSpreadsheetProcessReport {
  rowsToBeProcessed: number;
  actullyProcessedRows: number;
  rowsFailed: number;
  duplicateRowIds: number[];
  assignedToNotFound: number[];
  otherIssue: { rowId: number; issue: string }[];
  emptyRows: number[];
}

// Interface for Filtering Leads
export interface IAllLeadFilter {
  course: CourseType[]; // Accepts multiple course values as an array
  location: string[]; // Array for multiple locations
  assignedTo: string[]; // Array for multiple assigned users
  startDate?: string; // Date range start
  endDate?: string; // Date range end
  leadType: LeadType[]; // Lead Type Enum
  finalConversionType: FinalConversionType[];
  startLTCDate? : string;
  endLTCDate? : string;
}

export interface IAdminAnalyticsFilter {
  location: string[]; // Array for multiple locations
  assignedTo: string[]; // Array for multiple assigned users
  leadTypeChangeDateStart?: string; // Date range start
  leadTypeChangeDateEnd?: string; // Date range end
  source: []
}
