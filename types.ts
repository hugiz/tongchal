
export type Role = 'DIRECTOR' | 'TEACHER';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

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
  attendanceDays: string[]; // 추가: 등원 요일 ['월', '수', '금']
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  workbooks: string[];
  attendanceDays: string[]; // 추가: 반 기본 등원 요일
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

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface AppState {
  users: User[];
  students: Student[];
  classes: Class[];
  workbooks: Workbook[];
  progress: ProgressRecord[];
  consultations: ConsultationRecord[];
  attendance: AttendanceRecord[];
}
