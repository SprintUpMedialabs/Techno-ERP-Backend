import { Types } from 'mongoose';
import { Course, FinalConversionType, LeadType, Locations } from '../../config/constants';
import { Gender } from 'aws-sdk/clients/polly';

export interface IMarketingSpreadsheetProcessReport {
  startingRowNumber: number;
  endingRowNumber: number;
  rowsToBeProcessed: number;
  rowsFailed: number;
  
  duplicateRowIds: {rowNumber: number, phoneNumber: string, name: string}[];
  phoneNumberAndNameEmpty: {rowNumber: number, phoneNumber: string, name: string}[];
  assignedToNotFound: {rowNumber: number, phoneNumber: string, name: string}[];
  emptyRows: {rowNumber: number, phoneNumber: string, name: string}[];
  unauthorizedAssignedTo: {rowNumber: number, phoneNumber: string, name: string}[];
  invalidPhoneNumber: {rowNumber: number, phoneNumber: string, name: string}[];
  otherIssue: {rowNumber: number, phoneNumber: string, name: string, issue: string}[];
}
// Interface for Filtering Leads
export interface IAllLeadFilter {
  course: Course[]; // Accepts multiple course values as an array
  city: Locations[]; // Array for multiple locations
  assignedTo: Types.ObjectId[]; // Array for multiple assigned users
  //  | TODO: need to test this 
  startDate?: string; // Date range start
  endDate?: string; // Date range end
  leadType: LeadType[]; // Lead Type Enum
  finalConversionType: FinalConversionType[];
  source: string[];
  startNextDueDate?: string;
  endNextDueDate?: string;
}

export interface IAdminAnalyticsFilter {
  city: Locations[]; // Array for multiple locations
  assignedTo: Types.ObjectId[]; // Array for multiple assigned users | TODO: need to test this
  school: string[];
  startDate?: string; // Date range start
  endDate?: string; // Date range end
  source?: string[];
  gender: Gender[];
}
