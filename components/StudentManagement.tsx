
import React, { useState } from 'react';
import { AppState, Student, Workbook, User } from '../types';
import { GRADES } from '../constants';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const StudentManagement: React.FC<Props> = ({ state, updateState, user }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [wbMenuStudentId, setWbMenuStudentId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    grade: GRADES[0],
    classId: state.classes[0]?.id || '',
    workbookIds: [] as string[]
  });

  const isDirector = user?.role === 'DIRECTOR';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: Student = {
      id: 's' + Date.now(),
      name: formData.name,
      grade: formData.grade,
      classId: formData.classId,
      workbooks: formData.workbookIds
    };

    updateState(prev => ({
      ...prev,
      students: [...prev.students, newStudent]
    }));
    setIsAdding(false);
    setFormData({ name: '', grade: GRADES[0], classId: state.classes[0]?.id || '', workbookIds: [] });
  };

  const handleClassChange = (studentId: string, newClassId: string) => {
    updateState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === studentId ? { ...s, classId: newClassId } : s)
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
    if (confirm('정말로 이 학생을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) {
      updateState(prev => ({
        ...prev,
        students: prev.students.filter(s => s.id !== id),
        progress: prev.progress.filter(p => p.studentId !== id),
        consultations: prev.consultations.filter(c => c.studentId !== id),
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">학생 관리</h2>
          <p className="text-slate-500">반에 배정하면 공통 교재가 자동 연결되며, 필요시 개인 교재를 추가할 수 있습니다.</p>
        </div>
        {isDirector && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <span>{isAdding ? '닫기' : '✨ 신규 학생 등록'}</span>
          </button>
        )}
      </div>

      {isAdding && isDirector && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">학생 이름</label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="이름 입력"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">학년 선택</label>
              <select 
                value={formData.grade}
                onChange={e => setFormData({...formData, grade: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              >
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">배정할 반</label>
              <select 
                value={formData.classId}
                onChange={e => setFormData({...formData, classId: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              >
                <option value="">반 선택</option>
                {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">
            학생 등록 완료
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">이름</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">학년</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">배정 반 (수정가능)</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">학습 교재 (🏛️반 / 👤개인)</th>
                {isDirector && <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">관리</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.students.map(student => {
                const studentClass = state.classes.find(c => c.id === student.classId);
                const classWorkbooks = studentClass?.workbooks || [];
                const individualWorkbooks = student.workbooks || [];
                
                return (
                  <tr key={student.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 shadow-sm">{student.name[0]}</div>
                        <span className="font-bold text-slate-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-500 text-sm font-medium">{student.grade}</td>
                    <td className="px-8 py-6">
                      {isDirector ? (
                        <select 
                          value={student.classId}
                          onChange={(e) => handleClassChange(student.id, e.target.value)}
                          className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase px-2 py-1.5 rounded-xl border border-indigo-100 outline-none cursor-pointer hover:bg-indigo-100 transition-all"
                        >
                          <option value="">미배정</option>
                          {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black uppercase border border-slate-100">
                          {studentClass?.name || '미배정'}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 relative">
                      <div className="flex flex-wrap gap-1 items-center">
                        {/* 반 공통 교재: 반 설정 시 자동 표시 */}
                        {classWorkbooks.map(wid => {
                          const wb = state.workbooks.find(w => w.id === wid);
                          return <span key={wid} title="반 공통 교재 (자동 연동)" className="text-[9px] bg-indigo-50 text-indigo-500 font-bold px-2 py-0.5 rounded-lg border border-indigo-200">🏛️ {wb?.title}</span>;
                        })}
                        {/* 개인 교재: 별도 추가분 */}
                        {individualWorkbooks.map(wid => {
                          const wb = state.workbooks.find(w => w.id === wid);
                          return <span key={wid} title="개인 전용 교재" className="text-[9px] bg-amber-50 text-amber-500 font-bold px-2 py-0.5 rounded-lg border border-amber-200">👤 {wb?.title}</span>;
                        })}
                        {/* 추가 버튼 */}
                        <button 
                          onClick={() => setWbMenuStudentId(wbMenuStudentId === student.id ? null : student.id)}
                          className="text-[9px] bg-slate-800 text-white font-black px-2 py-0.5 rounded-lg hover:bg-slate-700 transition-all ml-1 shadow-sm active:scale-90"
                        >
                          + 개인교재
                        </button>
                      </div>

                      {/* 교재 추가 레이어 */}
                      {wbMenuStudentId === student.id && (
                        <div className="absolute top-12 left-8 z-20 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in duration-200">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">개인 교재 관리</h4>
                            <button onClick={() => setWbMenuStudentId(null)} className="text-slate-300 hover:text-rose-500">✕</button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {state.workbooks.map(wb => {
                              const isClassWb = classWorkbooks.includes(wb.id);
                              const isIndividualWb = individualWorkbooks.includes(wb.id);
                              if (isClassWb) return null; // 반 교재는 중복 추가 불가

                              return (
                                <button
                                  key={wb.id}
                                  onClick={() => handleToggleIndividualWorkbook(student.id, wb.id)}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                    isIndividualWb 
                                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                  }`}
                                >
                                  {isIndividualWb ? '✓ ' : '+ '}{wb.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </td>
                    {isDirector && (
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all ml-auto"
                        >
                          ✕
                        </button>
                      </td>
                    )}
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
