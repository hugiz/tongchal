
import React, { useState } from 'react';
import { AppState, User, MakeupRecord, MakeupMethod, MakeupStatus } from '../types';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const MakeupManagement: React.FC<Props> = ({ state, updateState, user }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [studentId, setStudentId] = useState('');
  const [absentDate, setAbsentDate] = useState('');
  const [makeupDate, setMakeupDate] = useState('');
  const [method, setMethod] = useState<MakeupMethod>('TEACHER');
  const [status, setStatus] = useState<MakeupStatus>('PENDING');
  const [note, setNote] = useState('');

  const isDirector = user?.role === 'DIRECTOR';
  const today = new Date().toISOString().split('T')[0];

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !absentDate || !makeupDate) {
      alert('학생과 날짜 정보를 모두 입력해주세요.');
      return;
    }

    if (editingId) {
      updateState(prev => ({
        ...prev,
        makeups: (prev.makeups || []).map(m => 
          m.id === editingId ? { ...m, studentId, absentDate, makeupDate, method, status, note } : m
        )
      }));
      setEditingId(null);
      alert('보강 기록이 수정되었습니다.');
    } else {
      const newRecord: MakeupRecord = {
        id: 'mk' + Date.now(),
        studentId,
        absentDate,
        makeupDate,
        method,
        status,
        note
      };
      updateState(prev => ({ ...prev, makeups: [...(prev.makeups || []), newRecord] }));
      alert('신규 보강이 등록되었습니다.');
    }

    resetForm();
    setIsAdding(false);
  };

  const resetForm = () => {
    setStudentId('');
    setAbsentDate('');
    setMakeupDate('');
    setMethod('TEACHER');
    setStatus('PENDING');
    setNote('');
  };

  const startEdit = (m: MakeupRecord) => {
    setStudentId(m.studentId);
    setAbsentDate(m.absentDate);
    setMakeupDate(m.makeupDate);
    setMethod(m.method);
    setStatus(m.status);
    setNote(m.note);
    setEditingId(m.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('이 보강 기록을 삭제하시겠습니까?')) {
      updateState(prev => ({
        ...prev,
        makeups: (prev.makeups || []).filter(m => m.id !== id)
      }));
    }
  };

  const toggleStatus = (m: MakeupRecord) => {
    const newStatus: MakeupStatus = m.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    updateState(prev => ({
      ...prev,
      makeups: (prev.makeups || []).map(item => 
        item.id === m.id ? { ...item, status: newStatus } : item
      )
    }));
  };

  const getMethodLabel = (m: MakeupMethod) => {
    switch(m) {
      case 'TEACHER': return '담임보강';
      case 'CLINIC': return '클리닉보강';
      case 'DIRECTOR_CLASS': return '원장수업보강';
      default: return '일반보강';
    }
  };

  const myClasses = isDirector ? state.classes : state.classes.filter(c => c.teacherId === user?.id);
  const myClassIds = myClasses.map(c => c.id);
  const myStudents = state.students.filter(s => myClassIds.includes(s.classId));
  const myStudentIds = myStudents.map(s => s.id);
  const filteredMakeups = (state.makeups || []).filter(m => myStudentIds.includes(m.studentId));

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">보강 관리 시스템</h2>
          <p className="text-slate-500 text-sm">결시 내역에 따른 보강 일정과 방법을 체계적으로 관리합니다.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); if(!isAdding) resetForm(); setEditingId(null); }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          {isAdding ? '닫기' : '✨ 신규 보강 등록'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAddOrUpdate} className="bg-white p-8 rounded-[32px] border border-indigo-100 shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">대상 학생</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" required>
                <option value="">학생 선택</option>
                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">결시 날짜</label>
              <input type="date" value={absentDate} onChange={e => setAbsentDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">보강 예정 날짜</label>
              <input type="date" value={makeupDate} onChange={e => setMakeupDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">보강 방법</label>
              <div className="flex flex-wrap gap-2">
                {(['TEACHER', 'CLINIC', 'DIRECTOR_CLASS'] as MakeupMethod[]).map(m => (
                  <button key={m} type="button" onClick={() => setMethod(m)} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${method === m ? 'bg-indigo-600 text-white shadow-md border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>
                    {m === 'TEACHER' ? '담임보강' : m === 'CLINIC' ? '클리닉보강' : '원장수업보강'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">현재 상태</label>
              <div className="flex gap-2">
                {(['PENDING', 'COMPLETED'] as MakeupStatus[]).map(s => (
                  <button key={s} type="button" onClick={() => setStatus(s)} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${status === s ? (s === 'COMPLETED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-amber-500 text-white border-amber-500') : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>
                    {s === 'PENDING' ? '보강 예정' : '보강 완료'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">참고 사항</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium" placeholder="보강 교재나 구체적인 내용을 입력하세요." />
          </div>

          <button type="submit" className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-slate-700 transition-all active:scale-[0.98]">
            {editingId ? '기록 수정 완료' : '보강 기록 저장'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">상태</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">학생</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">결시일 / 보강일</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">보강 방법</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">비고</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMakeups.slice().reverse().map(m => {
                const student = state.students.find(s => s.id === m.studentId);
                return (
                  <tr key={m.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(m)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}
                      >
                        {m.status === 'COMPLETED' ? '완료' : '예정'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800">{student?.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{student?.grade}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-rose-500 font-black">결: {m.absentDate}</span>
                        <span className="text-indigo-600 font-black">보: {m.makeupDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${m.method === 'TEACHER' ? 'bg-blue-50 text-blue-500 border-blue-100' : m.method === 'CLINIC' ? 'bg-purple-50 text-purple-500 border-purple-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                        {getMethodLabel(m.method)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{m.note || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(m)} className="p-2 rounded-xl bg-indigo-50 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 rounded-xl bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMakeups.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-300 italic font-black">등록된 보강 기록이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MakeupManagement;
