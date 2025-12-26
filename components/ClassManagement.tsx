
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
  const isDirector = user?.role === 'DIRECTOR';

  const visibleClasses = isDirector
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

  const handleDeleteClass = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 반을 삭제하시겠습니까? 소속된 학생들의 반 정보가 초기화됩니다.')) {
      updateState(prev => ({
        ...prev,
        classes: prev.classes.filter(c => c.id !== id),
        students: prev.students.map(s => s.classId === id ? { ...s, classId: '' } : s)
      }));
    }
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
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">반 및 출석 관리</h2>
          <p className="text-slate-500">학급을 관리하고 오늘 등원 여부를 체크하세요.</p>
        </div>
        {isDirector && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            {isAdding ? '닫기' : '✨ 새 학급 개설'}
          </button>
        )}
      </div>

      {isAdding && isDirector && (
        <form onSubmit={handleAddClass} className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">반 명칭</label>
              <input 
                type="text" 
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
                placeholder="예: 초등 기하 집중반"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">담당 선생님</label>
              <select 
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
              >
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.role === 'DIRECTOR' ? '원장' : '교사'})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">기본 교재 설정</label>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {state.workbooks.map(wb => (
                <button
                  key={wb.id}
                  type="button"
                  onClick={() => toggleWorkbook(wb.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedWorkbookIds.includes(wb.id)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {wb.title}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-slate-700 active:scale-95 transition-all">학급 개설 완료</button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {visibleClasses.map(cls => {
          const teacher = state.users.find(u => u.id === cls.teacherId);
          const classStudents = state.students.filter(s => s.classId === cls.id);
          const isExpanded = expandedClassId === cls.id;
          const presentCount = state.attendance.filter(a => a.classId === cls.id && a.date === today && a.status === 'PRESENT').length;

          return (
            <div 
              key={cls.id} 
              className={`bg-white rounded-3xl shadow-sm border transition-all overflow-hidden ${isExpanded ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-100 hover:shadow-md'}`}
            >
              <div 
                className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
                onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
              >
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl font-black shadow-inner">
                    {cls.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800">{cls.name}</h4>
                    <p className="text-xs font-bold text-slate-400">담임: {teacher?.name} | {classStudents.length}명의 원생</p>
                  </div>
                </div>
                
                <div className="mt-5 md:mt-0 flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1">Attendance</p>
                    <p className="text-lg font-black text-indigo-600">{presentCount} / {classStudents.length}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isDirector && (
                      <button 
                        onClick={(e) => handleDeleteClass(cls.id, e)}
                        className="p-2.5 rounded-xl bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        title="반 삭제"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-8 pt-4 border-t border-slate-50 bg-slate-50/20 animate-in slide-in-from-top duration-300">
                  <div className="mb-6">
                    <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                      DAILY ATTENDANCE LOG ({today})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {classStudents.map(student => {
                        const att = state.attendance.find(a => a.studentId === student.id && a.date === today);
                        return (
                          <div key={student.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{student.name}</p>
                              <p className="text-[10px] font-bold text-slate-300">{student.grade}</p>
                            </div>
                            <div className="flex space-x-1">
                              <AttendanceBtn label="출석" active={att?.status === 'PRESENT'} color="bg-emerald-500" onClick={() => handleAttendance(student.id, cls.id, 'PRESENT')} />
                              <AttendanceBtn label="지각" active={att?.status === 'LATE'} color="bg-amber-500" onClick={() => handleAttendance(student.id, cls.id, 'LATE')} />
                              <AttendanceBtn label="결석" active={att?.status === 'ABSENT'} color="bg-rose-500" onClick={() => handleAttendance(student.id, cls.id, 'ABSENT')} />
                            </div>
                          </div>
                        );
                      })}
                      {classStudents.length === 0 && <p className="text-sm text-slate-300 italic font-bold">배정된 학생이 없습니다.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {visibleClasses.length === 0 && (
          <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-3 text-slate-300">
            <span className="text-4xl">🏫</span>
            <p className="font-bold">조회 가능한 반이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceBtn = ({ label, active, color, onClick }: { label: string, active: boolean, color: string, onClick: () => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
      active ? `${color} text-white shadow-lg scale-110 ring-2 ring-white` : 'bg-slate-50 text-slate-300 border border-slate-100 hover:border-slate-200'
    }`}
  >
    {label}
  </button>
);

export default ClassManagement;
