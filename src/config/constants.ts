/**
 * Marketing Module Enums
*/
export enum UserRoles {
  ADMIN = 'ADMIN',
  LEAD_MARKETING = 'LEAD_MARKETING',
  EMPLOYEE_MARKETING = 'EMPLOYEE_MARKETING',
  BASIC_USER = 'BASIC_USER',
  COUNSELOR = 'COUNSELOR'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHERS',
  NOT_TO_MENTION = 'NOT_TO_MENTION'
}


export enum LeadType {
  ORANGE = 'OPEN',
  RED = 'NOT_INTERESTED',
  BLACK = 'COURSE_UNAVAILABLE',
  BLUE = 'NO_CLARITY',
  YELLOW = 'INTERESTED',
  GREEN = 'ADMISSION',
  WHITE = 'DID_NOT_PICK'
}


export enum FinalConversionType {
  PINK = 'PENDING',
  GREEN = 'CONVERTED',
  RED = 'NOT_CONVERTED'
}


/**
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
  Advertising = "Advertising",
  BusinessAssociate = "Business Associate",
  DigitalMarketing = "Digital Marketing",
  DirectWalkIn = "Direct Walk-in",
  LUNPGExternalVenue = "LU/NPG/External Venue",
  StudentReference = "Student Reference",
  TechnoligenceStaffCalling = "Technoligence/Staff Calling",
  Other = "Other"
};

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


export enum AcademicDetails {
  Tenth = "10th",
  Twelfth = "12th",
  Graduation = "Graduation",
  Others = "Others"
}


export enum ApplicationIdPrefix{
  "TIHS" = "TIHS",
  "TIMS" = "TIMS",
  "TCL" = "TCL"
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
  TENTH_MARKSHEET = '10th Marksheet',
  TENTH_CERTIFICATE = '10th Certificate',
  TWELFTH_MARKSHEET = '12th Marksheet',
  TWELFTH_CERTIFICATE = '12th Certificate',
  GRADUATION_FINAL_YEAR_MARKSHEET = 'Graduation Final Year Marksheet',
  CHARACTER_CERTIFICATE = 'Character Certificate',
  TC_MIGRATION = 'T.C./Migration',
  MEDICAL_CERTIFICATE = 'Medical Certificate',
  ANTI_RAGGING_BY_STUDENT = 'Anti Ragging by Student',
  ANTI_RAGGING_BY_PARENT = 'Anti Ragging by Parent',
  ALLOTMENT_LETTER = 'Allotment Letter',
  PHOTO = 'Photo',
  CASTE_CERTIFICATE = 'Caste Certificate',
  INCOME_CERTIFICATE = 'Income Certificate',
  NIVAS_CERTIFICATE = 'Nivas Certificate',
  GAP_AFFIDAVIT = 'Gap Affidavit',
  AADHAR = 'Aadhar',
  DECLARATION_FILLED = 'Declaration Filled',
  PHYSICALLY_HANDICAPPED_CERTIFICATE = 'Physically Handicapped Certificate',
  EWS_CERTIFICATE = 'EWS Certificate'
}


export enum ApplicationStatus {
  STEP_1 = 'Step_1',
  STEP_2 = 'Step_2',
  STEP_3 = 'Step_3',
  STEP_4 = 'Step_4'
}



export const MARKETING_SHEET = 'Marketing Sheet'