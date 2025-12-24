
import React, { useState } from 'react';
import { AppState, User, Class, AttendanceStatus, AttendanceRecord } from '../types';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const ClassManagement: React.FC<Props> = ({ state, updateState, user }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(user?.id || '');
  const [selectedWorkbookIds, setSelectedWorkbookIds] = useState<string[]>([]);

  const today = new Date().toISOString().split('T')[0];

  // Role-based filtering: Director sees all, Teacher sees only their classes
  const visibleClasses = user?.role === 'DIRECTOR'
    ? state.classes
    : state.classes.filter(c => c.teacherId === user?.id);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;

    const newClass: Class = {
      id: 'c' + Date.now(),
      name: newClassName,
      teacherId: selectedTeacherId,
      workbooks: selectedWorkbookIds
    };

    updateState(prev => ({
      ...prev,
      classes: [...prev.classes, newClass]
    }));
    setNewClassName('');
    setSelectedWorkbookIds([]);
    setIsAdding(false);
  };

  const handleAttendance = (studentId: string, classId: string, status: AttendanceStatus) => {
    const existingIndex = state.attendance.findIndex(a => a.studentId === studentId && a.date === today);
    
    updateState(prev => {
      const newAttendance = [...prev.attendance];
      if (existingIndex > -1) {
        newAttendance[existingIndex] = { ...newAttendance[existingIndex], status };
      } else {
        newAttendance.push({
          id: 'at' + Date.now() + Math.random(),
          studentId,
          classId,
          date: today,
          status
        });
      }
      return { ...prev, attendance: newAttendance };
    });
  };

  const toggleWorkbook = (id: string) => {
    setSelectedWorkbookIds(prev => 
      prev.includes(id) ? prev.filter(wid => wid !== id) : [...prev, id]
    );
  };

  const teachers = state.users.filter(u => u.role === 'TEACHER' || u.role === 'DIRECTOR');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">반 및 출석 관리</h2>
          <p className="text-slate-500">
            {user?.role === 'DIRECTOR' ? '학원 전체 반 목록입니다.' : '내가 담당하는 반 목록입니다.'}
          </p>
        </div>
        {user?.role === 'DIRECTOR' && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:bg-indigo-700"
          >
            {isAdding ? '닫기' : '새 반 추가'}
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddClass} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">반 이름</label>
              <input 
                type="text" 
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                placeholder="예: 초등 기초 A반"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">담당 선생님</label>
              <select 
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
              >
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.role === 'DIRECTOR' ? '원장' : '교사'})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">공통 학습 문제집</label>
            <div className="flex flex-wrap gap-2">
              {state.workbooks.map(wb => (
                <button
                  key={wb.id}
                  type="button"
                  onClick={() => toggleWorkbook(wb.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedWorkbookIds.includes(wb.id)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {wb.title}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">반 생성 완료</button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {visibleClasses.map(cls => {
          const teacher = state.users.find(u => u.id === cls.teacherId);
          const classStudents = state.students.filter(s => s.classId === cls.id);
          const isExpanded = expandedClassId === cls.id;
          
          // Current attendance stats for this class
          const classAttendance = state.attendance.filter(a => a.classId === cls.id && a.date === today);
          const presentCount = classAttendance.filter(a => a.status === 'PRESENT').length;

          return (
            <div 
              key={cls.id} 
              className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${isExpanded ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-100'}`}
            >
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 text-xl font-bold">
                    {cls.name[0]}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{cls.name}</h4>
                    <p className="text-xs text-slate-500">교사: {teacher?.name} | {classStudents.length}명의 학생</p>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">오늘 출석 현황</p>
                    <p className="text-sm font-bold text-indigo-600">{presentCount} / {classStudents.length} 등원</p>
                  </div>
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-50 animate-in slide-in-from-top duration-200">
                  <div className="mb-4">
                    <h5 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                      당일 출석 체크 ({today})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {classStudents.map(student => {
                        const att = state.attendance.find(a => a.studentId === student.id && a.date === today);
                        return (
                          <div key={student.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{student.name}</p>
                              <p className="text-[10px] text-slate-500">{student.grade}</p>
                            </div>
                            <div className="flex space-x-1">
                              <AttendanceBtn 
                                label="출석" 
                                active={att?.status === 'PRESENT'} 
                                color="bg-emerald-500" 
                                onClick={() => handleAttendance(student.id, cls.id, 'PRESENT')}
                              />
                              <AttendanceBtn 
                                label="지각" 
                                active={att?.status === 'LATE'} 
                                color="bg-amber-500" 
                                onClick={() => handleAttendance(student.id, cls.id, 'LATE')}
                              />
                              <AttendanceBtn 
                                label="결석" 
                                active={att?.status === 'ABSENT'} 
                                color="bg-rose-500" 
                                onClick={() => handleAttendance(student.id, cls.id, 'ABSENT')}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {classStudents.length === 0 && <p className="text-sm text-slate-400 italic">배정된 학생이 없습니다.</p>}
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50/50 p-4 rounded-xl">
                    <h5 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">지정 문제집</h5>
                    <div className="flex flex-wrap gap-2">
                      {(cls.workbooks || []).map(wid => {
                        const wb = state.workbooks.find(w => w.id === wid);
                        return <span key={wid} className="text-xs bg-white text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">{wb?.title}</span>;
                      })}
                      {(!cls.workbooks || cls.workbooks.length === 0) && <span className="text-xs text-slate-400">지정된 문제집 없음</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {visibleClasses.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400">조회 가능한 반이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceBtn = ({ label, active, color, onClick }: { label: string, active: boolean, color: string, onClick: () => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
      active ? `${color} text-white shadow-md scale-105` : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
    }`}
  >
    {label}
  </button>
);

export default ClassManagement;
