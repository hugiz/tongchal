
import React, { useState } from 'react';
import { AppState, User, ProgressRecord } from '../types';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const LearningStatus: React.FC<Props> = ({ state, updateState, user }) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedWbId, setSelectedWbId] = useState('');
  const [page, setPage] = useState(0);

  const isDirector = user?.role === 'DIRECTOR';
  const teacherClasses = isDirector 
    ? state.classes 
    : state.classes.filter(c => c.teacherId === user?.id);
  const teacherClassIds = teacherClasses.map(c => c.id);
  
  const myStudents = state.students.filter(s => teacherClassIds.includes(s.classId));
  const myStudentIds = myStudents.map(s => s.id);

  const selectedStudent = state.students.find(s => s.id === selectedStudentId);
  const studentClass = state.classes.find(c => c.id === selectedStudent?.classId);
  
  // 교재 리스트 분류
  const classWorkbooks = state.workbooks.filter(wb => studentClass?.workbooks.includes(wb.id));
  const individualWorkbooks = state.workbooks.filter(wb => selectedStudent?.workbooks.includes(wb.id));

  const visibleProgress = state.progress.filter(p => myStudentIds.includes(p.studentId));

  const handleUpdateProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedWbId) return;

    const newRecord: ProgressRecord = {
      id: 'p' + Date.now(),
      studentId: selectedStudentId,
      workbookId: selectedWbId,
      currentPage: page,
      date: new Date().toISOString().split('T')[0]
    };

    updateState(prev => ({ ...prev, progress: [...prev.progress, newRecord] }));
    setPage(0);
    alert('학습 진도가 업데이트 되었습니다.');
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">학습 현황 기록</h2>
        <p className="text-slate-500">담당 학생들의 교재 진도를 공통/개인별로 관리합니다.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-indigo-50 rounded-xl">✍️</span> 오늘의 학습 기록
          </h3>
          <form onSubmit={handleUpdateProgress} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">학생 선택</label>
              <select 
                value={selectedStudentId}
                onChange={e => { setSelectedStudentId(e.target.value); setSelectedWbId(''); }}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all"
                required
              >
                <option value="">학생을 선택하세요</option>
                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
            </div>

            {selectedStudent && (
              <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">학습 교재 선택</label>
                  <select 
                    value={selectedWbId}
                    onChange={e => setSelectedWbId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all"
                    required
                  >
                    <option value="">문제집 선택</option>
                    {classWorkbooks.length > 0 && (
                      <optgroup label="🏛️ 반 공통 교재">
                        {classWorkbooks.map(wb => <option key={wb.id} value={wb.id}>{wb.title}</option>)}
                      </optgroup>
                    )}
                    {individualWorkbooks.length > 0 && (
                      <optgroup label="👤 개인 전용 교재">
                        {individualWorkbooks.map(wb => <option key={wb.id} value={wb.id}>{wb.title}</option>)}
                      </optgroup>
                    )}
                    {classWorkbooks.length === 0 && individualWorkbooks.length === 0 && (
                      <option disabled>배정된 교재가 없습니다.</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">완료된 페이지 번호</label>
                  <input 
                    type="number" 
                    value={page}
                    onChange={e => setPage(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 font-black transition-all"
                    placeholder="최근 페이지"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">
                  진도 업데이트
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-lg font-bold text-slate-800">최근 업데이트된 진도</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">학생명</th>
                  <th className="px-6 py-4">교재명</th>
                  <th className="px-6 py-4">진척도</th>
                  <th className="px-6 py-4">구분</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visibleProgress.slice().reverse().slice(0, 10).map(p => {
                  const student = state.students.find(s => s.id === p.studentId);
                  const studentClass = state.classes.find(c => c.id === student?.classId);
                  const wb = state.workbooks.find(w => w.id === p.workbookId);
                  const percent = Math.min(100, Math.round((p.currentPage / (wb?.totalPages || 1)) * 100));
                  const isClassWb = studentClass?.workbooks.includes(p.workbookId);
                  
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-5 font-bold text-slate-700">{student?.name}</td>
                      <td className="px-6 py-5 text-xs text-slate-500 font-medium">{wb?.title}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[80px]">
                            <div className="h-full bg-indigo-500 transition-all duration-700 ease-out" style={{ width: `${percent}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-indigo-600">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                          isClassWb ? 'bg-indigo-50 text-indigo-400 border-indigo-100' : 'bg-amber-50 text-amber-500 border-amber-100'
                        }`}>
                          {isClassWb ? '반 공통' : '개인'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningStatus;
