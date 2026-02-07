export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional because we might sanitize it before returning to UI
  name: string;
  role: UserRole;
  email: string;
  department?: string; // Specific to Teachers
  studentId?: string; // Links to Student record if role is STUDENT
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  course: string;
  semester: number;
  email: string;
  phone: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  totalLectures: number;
  lecturesAttended: number;
  lastUpdated: string;
}

export interface PerformanceRecord {
  id: string;
  studentId: string;
  subject: string;
  marksObtained: number; // Out of 100
  totalMarks: number;
  remark: string; // Auto-generated or AI suggested
  isAiGenerated?: boolean;
}

export type LanguageCode = 'en' | 'hi' | 'gu' | 'mr' | 'ta' | 'te' | 'kn' | 'bn' | 'pa' | 'ml' | 'or' | 'ur';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export interface Translation {
  [key: string]: {
    [key in LanguageCode]: string;
  };
}