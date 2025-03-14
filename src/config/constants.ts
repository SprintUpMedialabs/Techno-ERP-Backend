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

export enum FinalConversionType {
  PINK = 'PENDING',
  GREEN = 'CONVERTED',
  RED = 'NOT_CONVERTED'
}

export const MARKETING_SHEET = 'Marketing Sheet'