
import React, { useState } from 'react';
import { AppState, User, Class, AttendanceStatus } from '../types';
import { DAYS_OF_WEEK } from '../constants';

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
  const [selectedDays, setSelectedDays] = useState<string[]>(['월', '수', '금']);

  const today = new Date().toISOString().split('T')[0];
  const isDirector = user?.role === 'DIRECTOR';

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;

    const newClass: Class = {
      id: 'c' + Date.now(),
      name: newClassName,
      teacherId: selectedTeacherId,
      workbooks: selectedWorkbookIds,
      attendanceDays: selectedDays
    };

    updateState(prev => ({ ...prev, classes: [...prev.classes, newClass] }));
    setNewClassName('');
    setSelectedWorkbookIds([]);
    setSelectedDays(['월', '수', '금']);
    setIsAdding(false);
  };

  const handleUpdateClassDays = (classId: string, day: string) => {
    updateState(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id !== classId) return c;
        const exists = c.attendanceDays.includes(day);
        return {
          ...c,
          attendanceDays: exists ? c.attendanceDays.filter(d => d !== day) : [...c.attendanceDays, day]
        };
      })
    }));
  };

  const toggleDaySelection = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleAttendance = (studentId: string, classId: string, status: AttendanceStatus) => {
    updateState(prev => {
      const existingIndex = prev.attendance.findIndex(a => a.studentId === studentId && a.date === today);
      const newAttendance = [...prev.attendance];
      if (existingIndex > -1) {
        newAttendance[existingIndex] = { ...newAttendance[existingIndex], status };
      } else {
        newAttendance.push({ id: 'at' + Date.now() + Math.random(), studentId, classId, date: today, status });
      }
      return { ...prev, attendance: newAttendance };
    });
  };

  const teachers = state.users.filter(u => u.role === 'TEACHER' || u.role === 'DIRECTOR');

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">반 및 출석 관리</h2>
          <p className="text-slate-500">학급별 수업 요일을 지정하면 소속 학생들의 기본 일정이 됩니다.</p>
        </div>
        {isDirector && (
          <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
            {isAdding ? '닫기' : '✨ 새 학급 개설'}
          </button>
        )}
      </div>

      {isAdding && isDirector && (
        <form onSubmit={handleAddClass} className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" placeholder="반 명칭" required />
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold">
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">수업 요일 설정</label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button key={day} type="button" onClick={() => toggleDaySelection(day)} className={`w-10 h-10 rounded-xl font-bold transition-all ${selectedDays.includes(day) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>{day}</button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-slate-700 transition-all">학급 개설 완료</button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {state.classes.map(cls => {
          const isExpanded = expandedClassId === cls.id;
          const classStudents = state.students.filter(s => s.classId === cls.id);
          const presentCount = state.attendance.filter(a => a.classId === cls.id && a.date === today && (a.status === 'PRESENT' || a.status === 'LATE')).length;

          return (
            <div key={cls.id} className={`bg-white rounded-3xl shadow-sm border transition-all overflow-hidden ${isExpanded ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-100'}`}>
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer" onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}>
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl font-black shadow-inner">{cls.name[0]}</div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800">{cls.name}</h4>
                    <div className="flex gap-1 mt-1">
                      {DAYS_OF_WEEK.map(day => (
                        <span key={day} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cls.attendanceDays.includes(day) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>{day}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right border-l pl-6 border-slate-100">
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1">Today Present</p>
                    <p className="text-lg font-black text-indigo-600">{presentCount} / {classStudents.length}</p>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="px-6 pb-8 pt-4 border-t border-slate-50 bg-slate-50/20">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">DAILY ATTENDANCE LOG</h5>
                      <div className="space-y-2">
                        {classStudents.map(student => {
                          const att = state.attendance.find(a => a.studentId === student.id && a.date === today);
                          return (
                            <div key={student.id} className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                              <span className="text-xs font-bold text-slate-700">{student.name}</span>
                              <div className="flex space-x-1">
                                {['PRESENT', 'LATE', 'ABSENT'].map(status => (
                                  <button key={status} onClick={() => handleAttendance(student.id, cls.id, status as AttendanceStatus)} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all ${att?.status === status ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}>{status === 'PRESENT' ? '출석' : status === 'LATE' ? '지각' : '결석'}</button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {isDirector && (
                      <div>
                        <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">CLASS DAYS SETTINGS</h5>
                        <div className="flex gap-2">
                          {DAYS_OF_WEEK.map(day => (
                            <button key={day} onClick={() => handleUpdateClassDays(cls.id, day)} className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${cls.attendanceDays.includes(day) ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>{day}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClassManagement;
