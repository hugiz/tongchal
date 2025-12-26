
export type Role = 'DIRECTOR' | 'TEACHER';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type ConsultationType = 'PHONE' | 'VISIT' | 'MESSAGE' | 'OTHER';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
}

export interface Workbook {
  id: string;
  title: string;
  totalPages: number;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  classId: string;
  workbooks: string[];
  attendanceDays: string[];
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  workbooks: string[];
  attendanceDays: string[];
}

export interface ProgressRecord {
  id: string;
  studentId: string;
  workbookId: string;
  currentPage: number;
  date: string;
}

export interface ConsultationRecord {
  id: string;
  studentId: string;
  teacherId: string;
  note: string;
  date: string;
}

export interface ParentConsultationRecord {
  id: string;
  studentId: string;
  type: ConsultationType;
  content: string;
  result: string;
  date: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
}

export interface AppState {
  users: User[];
  students: Student[];
  classes: Class[];
  workbooks: Workbook[];
  progress: ProgressRecord[];
  consultations: ConsultationRecord[];
  parentConsultations: ParentConsultationRecord[];
  attendance: AttendanceRecord[];
}
