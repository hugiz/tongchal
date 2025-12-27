import { AppState, Role } from './types';

export const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'];

export const INITIAL_STATE: AppState = {
  users: [
    // 원장님 요청으로 admin/1234를 삭제하고 새로운 정보로 설정
    { id: 'director_01', username: 'director', password: 'insight123', name: '통찰수학 원장', role: 'DIRECTOR' },
  ],
  students: [
    { id: 's1', name: '홍길동', grade: '초등 5', classId: 'c1', workbooks: ['w1', 'w2'], attendanceDays: ['월', '수', '금'] },
    { id: 's2', name: '이영희', grade: '초등 6', classId: 'c1', workbooks: ['w1'], attendanceDays: ['월', '수', '금'] },
    { id: 's3', name: '김철수', grade: '중등 1', classId: 'c2', workbooks: ['w3'], attendanceDays: ['화', '목'] },
  ],
  classes: [
    { id: 'c1', name: 'A반 (기초)', teacherId: 'director_01', workbooks: ['w1'], attendanceDays: ['월', '수', '금'] },
    { id: 'c2', name: 'B반 (심화)', teacherId: 'director_01', workbooks: ['w3'], attendanceDays: ['화', '목'] },
  ],
  workbooks: [
    { id: 'w1', title: '디딤돌 수학 기본', totalPages: 160 },
    { id: 'w2', title: '쎈 연산', totalPages: 120 },
    { id: 'w3', title: '최상위 수학', totalPages: 180 },
  ],
  progress: [],
  consultations: [],
  parentConsultations: [],
  attendance: [],
  makeups: [],
  briefings: [],
};

export const GRADES = [
  '초등 1', '초등 2', '초등 3', '초등 4', '초등 5', '초등 6',
  '중등 1', '중등 2', '중등 3',
  '고등 1', '고등 2', '고등 3'
];