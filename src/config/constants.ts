export enum UserRoles {
  ADMIN = 'ADMIN',
  LEAD_MARKETING = 'LEAD_MARKETING',
  EMPLOYEE_MARKETING = 'EMPLOYEE_MARKETING',
  BASIC_USER = 'BASIC_USER'
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
