
import { AppState, Role } from './types';

export const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'];

export const INITIAL_STATE: AppState = {
  users: [
    { id: '1', username: 'admin', password: '1234', name: '김원장', role: 'DIRECTOR' },
    { id: '2', username: 'teacher1', password: 'teacher1', name: '이선생', role: 'TEACHER' },
    { id: '3', username: 'teacher2', password: 'teacher2', name: '박선생', role: 'TEACHER' },
  ],
  students: [
    { id: 's1', name: '홍길동', grade: '초등 5', classId: 'c1', workbooks: ['w1', 'w2'], attendanceDays: ['월', '수', '금'] },
    { id: 's2', name: '이영희', grade: '초등 6', classId: 'c1', workbooks: ['w1'], attendanceDays: ['월', '수', '금'] },
    { id: 's3', name: '김철수', grade: '중등 1', classId: 'c2', workbooks: ['w3'], attendanceDays: ['화', '목'] },
  ],
  classes: [
    { id: 'c1', name: 'A반 (기초)', teacherId: '2', workbooks: ['w1'], attendanceDays: ['월', '수', '금'] },
    { id: 'c2', name: 'B반 (심화)', teacherId: '3', workbooks: ['w3'], attendanceDays: ['화', '목'] },
  ],
  workbooks: [
    { id: 'w1', title: '디딤돌 수학 기본', totalPages: 160 },
    { id: 'w2', title: '쎈 연산', totalPages: 120 },
    { id: 'w3', title: '최상위 수학', totalPages: 180 },
  ],
  progress: [],
  consultations: [],
  attendance: [],
};

export const GRADES = [
  '초등 1', '초등 2', '초등 3', '초등 4', '초등 5', '초등 6',
  '중등 1', '중등 2', '중등 3',
  '고등 1', '고등 2', '고등 3'
];
