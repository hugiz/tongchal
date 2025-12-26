
import React, { useState } from 'react';
import { AppState, Student, User } from '../types';
import { GRADES, DAYS_OF_WEEK } from '../constants';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const StudentManagement: React.FC<Props> = ({ state, updateState, user }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [wbMenuStudentId, setWbMenuStudentId] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState('전체');
  
  const [formData, setFormData] = useState({
    name: '',
    grade: GRADES[0],
    classId: state.classes[0]?.id || '',
    workbookIds: [] as string[]
  });

  const isDirector = user?.role === 'DIRECTOR';
  const allGrades = ['전체', ...GRADES];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const studentClass = state.classes.find(c => c.id === formData.classId);
    
    const newStudent: Student = {
      id: 's' + Date.now(),
      name: formData.name,
      grade: formData.grade,
      classId: formData.classId,
      workbooks: formData.workbookIds,
      attendanceDays: studentClass ? [...studentClass.attendanceDays] : ['월', '수', '금'] // 반 요일을 기본값으로
    };

    updateState(prev => ({
      ...prev,
      students: [...prev.students, newStudent]
    }));
    setIsAdding(false);
    setFormData({ name: '', grade: GRADES[0], classId: state.classes[0]?.id || '', workbookIds: [] });
  };

  const handleClassChange = (studentId: string, newClassId: string) => {
    const studentClass = state.classes.find(c => c.id === newClassId);
    updateState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === studentId ? { 
        ...s, 
        classId: newClassId, 
        attendanceDays: studentClass ? [...studentClass.attendanceDays] : s.attendanceDays 
      } : s)
    }));
  };

  const handleGradeChange = (studentId: string, newGrade: string) => {
    updateState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === studentId ? { ...s, grade: newGrade } : s)
    }));
  };

  const handleToggleDay = (studentId: string, day: string) => {
    updateState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        const exists = s.attendanceDays.includes(day);
        return {
          ...s,
          attendanceDays: exists 
            ? s.attendanceDays.filter(d => d !== day) 
            : [...s.attendanceDays, day]
        };
      })
    }));
  };

  const handleToggleIndividualWorkbook = (studentId: string, workbookId: string) => {
    updateState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        const exists = s.workbooks.includes(workbookId);
        return {
          ...s,
          workbooks: exists 
            ? s.workbooks.filter(id => id !== workbookId)
            : [...s.workbooks, workbookId]
        };
      })
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm('정말로 이 학생을 삭제하시겠습니까?')) {
      updateState(prev => ({
        ...prev,
        students: prev.students.filter(s => s.id !== id),
        progress: prev.progress.filter(p => p.studentId !== id),
        consultations: prev.consultations.filter(c => c.studentId !== id),
      }));
    }
  };

  const filteredStudents = filterGrade === '전체' 
    ? state.students 
    : state.students.filter(s => s.grade === filterGrade);

  // 최근 30일 결석 횟수 계산
  const getAbsenceCount = (studentId: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return state.attendance.filter(a => 
      a.studentId === studentId && 
      a.status === 'ABSENT' && 
      new Date(a.date) >= thirtyDaysAgo
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">학생 관리</h2>
          <p className="text-slate-500 text-sm">학생별 수업 요일 및 결석 현황을 관리합니다.</p>
        </div>
        {isDirector && (
          <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95">
            <span>{isAdding ? '닫기' : '✨ 신규 학생 등록'}</span>
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {allGrades.map(g => (
          <button key={g} onClick={() => setFilterGrade(g)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterGrade === g ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 shadow-sm'}`}>{g}</button>
        ))}
      </div>

      {isAdding && isDirector && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">학생 이름</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold" placeholder="이름 입력" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">학년 선택</label>
              <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold">
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">배정할 반</label>
              <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold">
                <option value="">반 선택</option>
                {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">학생 등록 완료</button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">이름</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">학년 / 결석통계</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">수업 요일 (개별수정)</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">학습 교재</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => {
                const studentClass = state.classes.find(c => c.id === student.classId);
                const classWorkbooks = studentClass?.workbooks || [];
                const individualWorkbooks = student.workbooks || [];
                const absenceCount = getAbsenceCount(student.id);
                
                return (
                  <tr key={student.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shadow-sm">{student.name[0]}</div>
                        <span className="font-bold text-slate-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1">
                          <select value={student.grade} onChange={(e) => handleGradeChange(student.id, e.target.value)} className="bg-slate-50 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-200 outline-none cursor-pointer">
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border w-fit ${absenceCount > 0 ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            최근 30일 결석: {absenceCount}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-1">
                        {DAYS_OF_WEEK.map(day => (
                          <button key={day} onClick={() => handleToggleDay(student.id, day)} className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${student.attendanceDays.includes(day) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}>
                            {day}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 relative">
                      <div className="flex flex-wrap gap-1 items-center">
                        {classWorkbooks.map(wid => {
                          const wb = state.workbooks.find(w => w.id === wid);
                          return <span key={wid} className="text-[9px] bg-indigo-50 text-indigo-500 font-bold px-2 py-0.5 rounded-lg border border-indigo-200">🏛️ {wb?.title}</span>;
                        })}
                        {individualWorkbooks.map(wid => {
                          const wb = state.workbooks.find(w => w.id === wid);
                          return (
                            <span key={wid} className="flex items-center gap-1 text-[9px] bg-amber-50 text-amber-500 font-bold px-2 py-0.5 rounded-lg border border-amber-200">
                              👤 {wb?.title}
                              <button onClick={() => handleToggleIndividualWorkbook(student.id, wid)} className="text-rose-400 hover:text-rose-600 font-black leading-none ml-1">×</button>
                            </span>
                          );
                        })}
                        <button onClick={() => setWbMenuStudentId(wbMenuStudentId === student.id ? null : student.id)} className="text-[9px] bg-slate-800 text-white font-black px-2 py-0.5 rounded-lg hover:bg-slate-700 transition-all ml-1">+ 추가</button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {isDirector && (
                        <button onClick={() => handleDelete(student.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all ml-auto">✕</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
