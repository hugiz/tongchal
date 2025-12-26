
import React, { useState } from 'react';
import { AppState, Workbook, User } from '../types';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const WorkbookManagement: React.FC<Props> = ({ state, updateState, user }) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">문제집 관리</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs">새 문제집 추가</button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-400 mb-1">교재명</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-lg" required />
          </div>
          <div className="w-32">
            <label className="block text-xs font-bold text-slate-400 mb-1">총 페이지</label>
            <input type="number" value={formData.totalPages} onChange={e => setFormData({...formData, totalPages: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg" required />
          </div>
          <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold">저장</button>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {state.workbooks.map(wb => (
          <div key={wb.id} className="bg-white p-4 rounded-3xl border shadow-sm group relative">
            <h4 className="font-bold text-slate-800">{wb.title}</h4>
            <p className="text-xs text-slate-400 mt-1">{wb.totalPages}p</p>
            <button onClick={() => updateState(prev => ({ ...prev, workbooks: prev.workbooks.filter(w => w.id !== wb.id) }))} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkbookManagement;
