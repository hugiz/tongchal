
import React, { useState } from 'react';
import { AppState, Student, Workbook } from '../types';
import { GRADES } from '../constants';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const StudentManagement: React.FC<Props> = ({ state, updateState }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isQuickAddingWb, setIsQuickAddingWb] = useState(false);
  const [quickWbTitle, setQuickWbTitle] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    grade: GRADES[0],
    classId: state.classes[0]?.id || '',
    workbookIds: [] as string[]
  });

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
      totalPages: 150 // Default
    };

    updateState(prev => ({
      ...prev,
      workbooks: [...prev.workbooks, newWb]
    }));

    setFormData(prev => ({
      ...prev,
      workbookIds: [...prev.workbookIds, newWb.id]
    }));
    
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
          <p className="text-slate-500">원생 등록 및 정보를 관리합니다.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition-all flex items-center space-x-2"
        >
          <span>{isAdding ? '닫기' : '학생 추가'}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">이름</label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">학년</label>
              <select 
                value={formData.grade}
                onChange={e => setFormData({...formData, grade: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">배정 반</label>
              <select 
                value={formData.classId}
                onChange={e => setFormData({...formData, classId: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700">학습할 문제집 선택</label>
              <button 
                type="button"
                onClick={() => setIsQuickAddingWb(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center"
              >
                <span className="text-sm mr-1">+</span> 새 교재 등록
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.workbooks.map(wb => (
                <button
                  key={wb.id}
                  type="button"
                  onClick={() => toggleWorkbook(wb.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    formData.workbookIds.includes(wb.id)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {wb.title}
                </button>
              ))}
              {state.workbooks.length === 0 && <p className="text-xs text-slate-400">등록된 문제집이 없습니다.</p>}
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700">등록 완료</button>
        </form>
      )}

      {/* Quick Add Modal */}
      {isQuickAddingWb && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">새 문제집 빠른 등록</h3>
            <form onSubmit={handleQuickAddWorkbook}>
              <input 
                autoFocus
                type="text"
                value={quickWbTitle}
                onChange={e => setQuickWbTitle(e.target.value)}
                placeholder="문제집 이름을 입력하세요"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => setIsQuickAddingWb(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">이름</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">학년</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">현재 소속 반</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">문제집</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.students.map(student => {
              const studentClass = state.classes.find(c => c.id === student.classId);
              return (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{student.name}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{student.grade}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      {studentClass?.name || '미배정'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.workbooks.map(wid => {
                        const wb = state.workbooks.find(w => w.id === wid);
                        return <span key={wid} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{wb?.title}</span>;
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(student.id)}
                      className="text-rose-500 hover:text-rose-700 text-sm font-semibold"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentManagement;
