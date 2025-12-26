
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
  const [isQuickAddingWb, setIsQuickAddingWb] = useState(false);
  const [quickWbTitle, setQuickWbTitle] = useState('');
  
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

  const handleQuickAddWorkbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWbTitle) return;

    const newWb: Workbook = {
      id: 'w' + Date.now(),
      title: quickWbTitle,
      totalPages: 150 
    };

    updateState(prev => ({ ...prev, workbooks: [...prev.workbooks, newWb] }));
    setFormData(prev => ({ ...prev, workbookIds: [...prev.workbookIds, newWb.id] }));
    setQuickWbTitle('');
    setIsQuickAddingWb(false);
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

  const toggleWorkbook = (id: string) => {
    setFormData(prev => ({
      ...prev,
      workbookIds: prev.workbookIds.includes(id) 
        ? prev.workbookIds.filter(wid => wid !== id)
        : [...prev.workbookIds, id]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">학생 관리</h2>
          <p className="text-slate-500">원생 정보를 관리합니다. {isDirector ? '' : '(학생 등록은 원장님만 가능합니다)'}</p>
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
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">학습 문제집 지정</label>
              <button 
                type="button"
                onClick={() => setIsQuickAddingWb(true)}
                className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-100 transition-all"
              >
                + 새 교재 빠른 등록
              </button>
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {state.workbooks.map(wb => (
                <button
                  key={wb.id}
                  type="button"
                  onClick={() => toggleWorkbook(wb.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    formData.workbookIds.includes(wb.id)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {wb.title}
                </button>
              ))}
              {state.workbooks.length === 0 && <p className="text-xs text-slate-400">등록된 문제집이 없습니다.</p>}
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">
            학생 등록 완료
          </button>
        </form>
      )}

      {isQuickAddingWb && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-2 text-slate-800">새 교재 등록</h3>
            <p className="text-xs text-slate-400 mb-6">문제집 명칭을 입력해주세요.</p>
            <form onSubmit={handleQuickAddWorkbook}>
              <input 
                autoFocus
                type="text"
                value={quickWbTitle}
                onChange={e => setQuickWbTitle(e.target.value)}
                placeholder="교재명 입력"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 mb-6 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsQuickAddingWb(false)} className="flex-1 px-4 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold">취소</button>
                <button type="submit" className="flex-1 px-4 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">이름</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">학년</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">배정 반</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">학습 교재</th>
                {isDirector && <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">삭제</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.students.map(student => {
                const studentClass = state.classes.find(c => c.id === student.classId);
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
                      <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase shadow-sm border border-indigo-100">
                        {studentClass?.name || '미배정'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1">
                        {student.workbooks.map(wid => {
                          const wb = state.workbooks.find(w => w.id === wid);
                          return <span key={wid} className="text-[9px] bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded-lg border border-slate-200">{wb?.title}</span>;
                        })}
                      </div>
                    </td>
                    {isDirector && (
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all ml-auto"
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
        {state.students.length === 0 && (
          <div className="p-20 text-center text-slate-300 font-bold flex flex-col items-center gap-2">
            <span className="text-4xl">👥</span>
            등록된 학생이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
