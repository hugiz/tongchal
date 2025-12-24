
import React, { useState } from 'react';
import { AppState, Workbook } from '../types';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const WorkbookManagement: React.FC<Props> = ({ state, updateState }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', totalPages: 100 });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const newWb: Workbook = {
      id: 'w' + Date.now(),
      title: formData.title,
      totalPages: formData.totalPages
    };

    updateState(prev => ({
      ...prev,
      workbooks: [...prev.workbooks, newWb]
    }));
    setFormData({ title: '', totalPages: 100 });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 문제집을 삭제하시겠습니까? 학생들의 학습 데이터에서 제외됩니다.')) {
      updateState(prev => ({
        ...prev,
        workbooks: prev.workbooks.filter(w => w.id !== id),
        students: prev.students.map(s => ({
          ...s,
          workbooks: s.workbooks.filter(wid => wid !== id)
        })),
        classes: prev.classes.map(c => ({
          ...c,
          workbooks: c.workbooks.filter(wid => wid !== id)
        }))
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">문제집 관리</h2>
          <p className="text-slate-500">학원에서 사용하는 모든 교재를 관리합니다.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:bg-indigo-700"
        >
          {isAdding ? '닫기' : '새 문제집 추가'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">문제집 명칭</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="예: 쎈 수학 중등 2-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">총 페이지 수</label>
            <input 
              type="number" 
              value={formData.totalPages}
              onChange={e => setFormData({...formData, totalPages: parseInt(e.target.value)})}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700">저장</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.workbooks.map(wb => (
          <div key={wb.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group">
            <h4 className="font-bold text-slate-800 pr-8">{wb.title}</h4>
            <p className="text-sm text-slate-500 mt-1">총 {wb.totalPages} 페이지</p>
            <button 
              onClick={() => handleDelete(wb.id)}
              className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkbookManagement;
