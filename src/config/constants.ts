/**
 * Marketing Module Enums
*/
export enum UserRoles {
  ADMIN = 'ADMIN',
  LEAD_MARKETING = 'LEAD_MARKETING',
  EMPLOYEE_MARKETING = 'EMPLOYEE_MARKETING',
  BASIC_USER = 'BASIC_USER',
  COUNSELOR = 'COUNSELOR',
  REGISTAR = 'REGISTAR',
  HOD = 'HOD',
  INSTRUCTOR = 'INSTRUCTOR',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  STUDENT = 'STUDENT',
  FINANCE = 'FINANCE',
  FRONT_DESK = 'FRONT_DESK',
  LAMBDA_FUNCTION = 'LAMBDA_FUNCTION'
}

export enum PipelineStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PipelineName {
  COURSE_DUES = 'COURSE_DUES',
  FINANCE_ANALYTICS = 'FINANCE_ANALYTICS',
  BACKUP = 'BACKUP',
  MARKETING_SOURCE_WISE_ANALYTICS = "MARKETING_SOURCE_WISE_ANALYTICS",
  INITIALIZE_MARKETING_ANALYTICS = "INITIALIZE_MARKETING_ANALYTICS",
  ITERATE_LEADS = "ITERATE_LEADS",
  ADMISSION_ANALYTICS_BASE_VALUE_ASSIGNMENT = "ADMISSION_ANALYTICS_BASE_VALUE_ASSIGNMENT",
  SYNC_DATABASE = "SYNC_DATABASE"
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHERS'
}


export enum Source {
  SCHOOL = 'School'
}

// Left Over Leads
// Not Interested

export enum LeadType {
  LEFT_OVER = 'LEFT_OVER',
  NOT_INTERESTED = 'NOT_INTERESTED',
  ACTIVE = 'ACTIVE',
  NEUTRAL = 'NEUTRAL',
  DID_NOT_PICK = 'DID_NOT_PICK',
  COURSE_UNAVAILABLE = 'COURSE_UNAVAILABLE',
  INVALID = 'INVALID'
}


export enum FinalConversionType {
  NO_FOOTFALL = 'NO_FOOTFALL',
  NEUTRAL = 'NEUTRAL',
  ADMISSION = 'ADMISSION',
  NOT_INTERESTED = 'NOT_INTERESTED'
}


/*
 * Admission Module Enums
*/
export enum Category {
  SC = "SC",
  ST = "ST",
  OBC = "OBC",
  GENERAL = "General",
  EWS = "EWS",
  OTHER = "Other"
};

export enum AdmissionReference {
  Advertising = 'Advertising',
  BusinessAssociate = 'Business Associate',
  DigitalMarketing = 'Digital Marketing',
  DirectWalkIn = 'Direct Walk-in',
  LUNPGExternalVenue = 'LU/NPG/External Venue',
  StudentReference = 'Student Reference',
  TechnoligenceStaffCalling = 'Technoligence',
  Other = 'Other'
}

export enum DropDownType {
  MARKETING_CITY = "MARKETING_CITY",
  FIX_MARKETING_CITY = "FIX_MARKETING_CITY",
  DISTRICT = "DISTRICT",
  MARKETING_SOURCE = "MARKETING_SOURCE",
  MARKETING_COURSE_CODE = "MARKETING_COURSE_CODE",
  FIX_MARKETING_COURSE_CODE = "FIX_MARKETING_COURSE_CODE",
  TELECALLER = "TELECALLER",
  COUNSELOR = "COUNSELLOR"
}

export enum PhysicalDocumentNoteStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  NOT_APPLICABLE = "NOT_APPLICABLE"
}

export enum Course {
  BCOM = "BCOM",
  BCOMH = "BCOMH",
  BAJMC = "BAJMC",
  BED = "BED",
  BSCM = "BSCM",
  BSCB = "BSCB",
  BBA = "BBA",
  BCA = "BCA",
  BVAA = "BVAA",
  BVAP = "BVAP",
  MAJMC = "MAJMC",
  MCOMC = "MCOMC",
  MBA = "MBA",
  LLB = "LLB",
  MCA = "MCA",
  MVAP = "MVAP",
  MSCC = "MSCC"
}


export enum EducationLevel {
  Tenth = "10th",
  Twelfth = "12th",
  Graduation = "Graduation",
  Others = "Others"
}


export enum FormNoPrefixes {
  "TIHS" = "TIHS",
  "TIMS" = "TIMS",
  "TCL" = "TCL",
  "PHOTO" = "PHOTO"
}


export enum Religion {
  HINDUISM = 'Hinduism',
  ISLAM = 'Islam',
  CHRISTIANITY = 'Christianity',
  SIKHISM = 'Sikhism',
  BUDDHISM = 'Buddhism',
  JAINISM = 'Jainism',
  OTHERS = 'Others',
}


export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}


export enum AdmittedThrough {
  DIRECT = 'Direct',
  COUNSELLING = 'Counselling'
}


export enum DocumentType {
  TENTH_MARKSHEET = '10th_Marksheet',
  TENTH_CERTIFICATE = '10th_Certificate',
  TWELFTH_MARKSHEET = '12th_Marksheet',
  TWELFTH_CERTIFICATE = '12th_Certificate',
  GRADUATION_FINAL_YEAR_MARKSHEET = 'Graduation_Final_Year_Marksheet',
  CHARACTER_CERTIFICATE = 'Character_Certificate',
  TC_MIGRATION = 'TC_Migration',
  MEDICAL_CERTIFICATE = 'Medical_Certificate',
  ANTI_RAGGING_BY_STUDENT = 'Anti_Ragging_by_Student',
  ANTI_RAGGING_BY_PARENT = 'Anti_Ragging_by_Parent',
  ALLOTMENT_LETTER = 'Allotment_Letter',
  PHOTO = 'Photo',
  CASTE_CERTIFICATE = 'Caste_Certificate',
  INCOME_CERTIFICATE = 'Income_Certificate',
  NIVAS_CERTIFICATE = 'Nivas_Certificate',
  GAP_AFFIDAVIT = 'Gap_Affidavit',
  AADHAR = 'Aadhar',
  DECLARATION_FILLED = 'Declaration_Filled',
  PHYSICALLY_HANDICAPPED_CERTIFICATE = 'Physically_Handicapped_Certificate',
  EWS_CERTIFICATE = 'EWS_Certificate',
  SIGNATURE = 'Signature'
}


export enum ApplicationStatus {
  STEP_1 = 'Step_1',
  STEP_2 = 'Step_2',
  STEP_3 = 'Step_3',
  STEP_4 = 'Step_4',
  CONFIRMED = 'Confirmed'
}


export enum ModuleNames {
  MARKETING = "MARKETING",
  ADMISSION = "ADMISSION",
  COURSE = "COURSE"
}


export enum Locations {
  KNP = "Kanpur",
  UNA = "Unnao",
  STP = "Sitapur",
  HRD = "Hardoi",
  BBK = "Barabanki",
  AMT = "Amethi",
  FTP = "Fatehpur",
  LKO = "Lucknow"
}


export enum FeeType {
  HOSTEL = "HOSTEL",
  TRANSPORT = "TRANSPORT",
  PROSPECTUS = "PROSPECTUS",
  STUDENTID = "STUDENTID",
  UNIFORM = "UNIFORM",
  STUDENTWELFARE = "STUDENTWELFARE",
  BOOKBANK = "BOOKBANK",
  EXAMFEES = "EXAMFEES",
  EDUCATION = "EDUCATION"
}

export enum AdmissionMode {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE"
}

export enum StatesOfIndia {
  ANDHRA_PRADESH = "Andhra Pradesh",
  ARUNACHAL_PRADESH = "Arunachal Pradesh",
  ASSAM = "Assam",
  BIHAR = "Bihar",
  CHHATTISGARH = "Chhattisgarh",
  GOA = "Goa",
  GUJARAT = "Gujarat",
  HARYANA = "Haryana",
  HIMACHAL_PRADESH = "Himachal Pradesh",
  JHARKHAND = "Jharkhand",
  KARNATAKA = "Karnataka",
  KERALA = "Kerala",
  MADHYA_PRADESH = "Madhya Pradesh",
  MAHARASHTRA = "Maharashtra",
  MANIPUR = "Manipur",
  MEGHALAYA = "Meghalaya",
  MIZORAM = "Mizoram",
  NAGALAND = "Nagaland",
  ODISHA = "Odisha",
  PUNJAB = "Punjab",
  RAJASTHAN = "Rajasthan",
  SIKKIM = "Sikkim",
  TAMIL_NADU = "Tamil Nadu",
  TELANGANA = "Telangana",
  TRIPURA = "Tripura",
  UTTAR_PRADESH = "Uttar Pradesh",
  UTTARAKHAND = "Uttarakhand",
  WEST_BENGAL = "West Bengal",
  ANDAMAN_AND_NICOBAR_ISLANDS = "Andaman and Nicobar Islands",
  CHANDIGARH = "Chandigarh",
  DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU = "Dadra and Nagar Haveli and Daman and Diu",
  DELHI = "Delhi",
  JAMMU_AND_KASHMIR = "Jammu and Kashmir",
  LADAKH = "Ladakh",
  LAKSHADWEEP = "Lakshadweep",
  PUDUCHERRY = "Puducherry"
}


export enum Countries {
  India = "India",
  NON_INDIA = "Non-India"
}

export enum AreaType {
  URBAN = "URBAN",
  RURAL = "RURAL",
  OTHERS = "OTHERS"
}


export const ADMISSION = 'admissions'

export const TGI = "TGI";
export const PHOTO = "PHOTO";

export enum COLLECTION_NAMES {
  USER = 'User',
  VERIFY_OTP = 'verifyotps',
  ENQUIRY = 'enquiries',
  ENQUIRY_DRAFT = 'enquirydrafts',
  ENQUIRY_ID_META_DATA = 'enquiryidmetadatas',
  STUDENT_FEE = 'studentfees',
  STUDENT_FEE_DRAFT = 'studentfeedrafts',
  DEPARTMENT_COURSE = 'deptandcourse',
  LEAD = 'leads',
  SPREADSHEET_META_DATA = 'spreadsheetmetadatas',
  YELLOW_LEAD = 'yellowleads',
  COURSE_OTHER_FEES = 'courseandotherfees',
  STUDENT = 'Student',
  DEPARTMENT_META_DATA = 'departmentmetadatas',
  COURSE_METADATA = 'coursemetadatas',
  COURSE = 'courses',
  DROP_DOWN_META_DATA = 'dropdownmetadatas',
  STUDENTREPO = "StudentRepo",
  TRANSACTION_HISTORY = "transactionhistories",
  TECHNO_META_DATA = "technometadatas",
  MARKETING_FOLLOW_UP_RAW_DATA = "marketingfollowupdatas",
  MARKETING_ANALYTICS = "marketinganalytics",
  COURSE_DUES = 'coursedues',
  COLLEGE_META_DATA = "collegemetadatas",
  FINANCE_ANALYTICS = "financeanalytics",
  MARKETING_SOURCE_WISE_ANALYTICS = "marketingsourcewiseanalytics",
  MARKETING_USER_WISE_ANALYTICS = "marketinguserwiseanalytics",
  MARKETING_USER_WISE_ANALYTICS_V1 = "marketinguserwiseanalyticsv1",
  OTP = "otps",
  ADMISSION_ANALYTICS = "admissionanalytics"
}


export enum LectureConfirmation {
  CONFIRMED = 'CONFIRMED',
  DELAYED = 'DELAYED',
  TO_BE_DONE = 'TO_BE_DONE'
}

export enum RequestAction {
  PUT = "PUT",
  POST = "POST",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export enum CourseMaterialType {
  LPLAN = 'LPlan',
  PPLAN = 'PPlan',
  GENERAL = 'General'
}


export enum CourseYears {
  First = 'First',
  Second = 'Second',
  Third = 'Third',
  Fourth = 'Fourth',
  Fifth = 'Fifth',
  Sixth = 'Sixth'
}

export enum FeeStatus {
  DUE = "DUE",
  PAID = "PAID"
}

export enum Schedule {
  ONE_TIME = "ONE_TIME",
  SEMESTER = "SEMESTER",
  YEARLY = "YEARLY",
  OPTIONAL = "OPTIONAL",
  AS_APPLICABLE = "AS_APPLICABLE"
}

export enum FeeActions {
  REFUND = "REFUND",
  DEPOSIT = "DEPOSIT"
}

export enum TransactionTypes {
  NEFT_IMPS_RTGS = "NEFT/RTGS/IMPS",
  UPI = "UPI",
  CASH = "CASH",
  CHEQUE = "CHEQUE",
  OTHERS = "OTHERS"
}


export enum FinanceFeeType {
  HOSTELCAUTIONMONEY = "HOSTELCAUTIONMONEY",
  HOSTELMAINTENANCE = "HOSTELMAINTENANCE",
  HOSTELYEARLY = "HOSTELYEARLY",    //OPTIONAL
  TRANSPORT = "TRANSPORT",  //OPTIONAL
  PROSPECTUS = "PROSPECTUS",  //ONE-TIME
  STUDENTID = "STUDENTID",  //ONE-TIME
  UNIFORM = "UNIFORM",    //ONE-TIME
  STUDENTWELFARE = "STUDENTWELFARE",  //YEARLY
  BOOKBANK = "BOOKBANK",  //SEMESTERWISE
  EXAMFEES = "EXAMFEES",
  MISCELLANEOUS = "MISCELLANEOUS", //OTHERS
  SEMESTERFEE = "SEMESTERFEE"
}


export enum FinanceFeeSchedule {
  HOSTELYEARLY = "YEARLY",
  HOSTELCAUTIONMONEY = "ONETIME",
  HOSTELMAINTENANCE = "YEARLY",
  TRANSPORT = "YEARLY",
  PROSPECTUS = "ONETIME",
  STUDENTID = "ONETIME",
  UNIFORM = "ONETIME",
  STUDENTWELFARE = "YEARLY",
  BOOKBANK = "HALF_YEARLY",
  EXAMFEES = "HALF_YEARLY",
  MISCELLANEOUS = "HALF_YEARLY",
  SEMESTERFEE = "HALF_YEARLY",
}

export enum Actions {
  INCREAMENT = 'INCREAMENT',
  DECREAMENT = 'DECREAMENT'
}

export enum MarketingAnalyticsEnum {
  NO_OF_CALLS = "NO_OF_CALLS"
}

export enum StudentStatus{
  NEW = "NEW",
  UPDATED = "UPDATED",
  OLD = "OLD"
}


export const ONLINE_SOURCES = [
  'Digital - Google Ads',
  'Digital - Meta Ads',
  'Digital - IVR',
  'Digital - TawkTo',
  'Digital - Website',
];

export const OFFLINE_SOURCES = [
  'LU/NPG/External Venue',
  'Student Reference',
  'Technoligence',
];

export const offlineSources = [
  'Board Exam',
  'CUET',
  'PG Data',
  'UG Data',
  'Student Reference',
];

export const onlineSources = [
  'Digital - Direct Call',
  'Digital - Google Ads',
  'Digital - WhatsApp',
  'Digital - IVR',
  'Digital - Meta',
  'Digital - TawkTo',
  'Digital - Website',
];

export enum AdmissionAggregationType {
  DATE_WISE = 'totalAdmissionDateWise',
  MONTH_WISE = 'totalAdmissionMonthWise',
  MONTH_AND_COURSE_WISE = 'totalAdmissionMonthAndCourseWise',
  YEAR_AND_COURSE_WISE = 'totalAdmissionYearAndCourseWise',
}