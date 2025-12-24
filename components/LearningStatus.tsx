
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

  const teacherClasses = user?.role === 'DIRECTOR' 
    ? state.classes 
    : state.classes.filter(c => c.teacherId === user?.id);
  const teacherClassIds = teacherClasses.map(c => c.id);
  const myStudents = state.students.filter(s => teacherClassIds.includes(s.classId));

  const selectedStudent = state.students.find(s => s.id === selectedStudentId);
  const studentWorkbooks = state.workbooks.filter(wb => selectedStudent?.workbooks.includes(wb.id));

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

    updateState(prev => ({
      ...prev,
      progress: [...prev.progress, newRecord]
    }));

    setPage(0);
    alert('진도가 업데이트 되었습니다.');
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">학습 현황 기록</h2>
        <p className="text-slate-500">학생들의 오늘 학습량을 기록하세요.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Record Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center">
            <span className="mr-2">📝</span> 기록하기
          </h3>
          <form onSubmit={handleUpdateProgress} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">학생 선택</label>
              <select 
                value={selectedStudentId}
                onChange={e => {
                  setSelectedStudentId(e.target.value);
                  setSelectedWbId('');
                }}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">학생을 선택하세요</option>
                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
            </div>

            {selectedStudent && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">문제집 선택</label>
                  <select 
                    value={selectedWbId}
                    onChange={e => setSelectedWbId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">문제집 선택</option>
                    {studentWorkbooks.map(wb => <option key={wb.id} value={wb.id}>{wb.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">현재 페이지</label>
                  <input 
                    type="number" 
                    value={page}
                    onChange={e => setPage(parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="최근 진행 페이지"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-md">
                  업데이트
                </button>
              </>
            )}
          </form>
        </div>

        {/* Recent Progress Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">최근 업데이트 현황</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-sm">
              <tr>
                <th className="px-6 py-3 font-semibold">학생명</th>
                <th className="px-6 py-3 font-semibold">문제집</th>
                <th className="px-6 py-3 font-semibold">진행 상태</th>
                <th className="px-6 py-3 font-semibold">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.progress.slice().reverse().slice(0, 10).map(p => {
                const student = state.students.find(s => s.id === p.studentId);
                const wb = state.workbooks.find(w => w.id === p.workbookId);
                const percent = Math.min(100, Math.round((p.currentPage / (wb?.totalPages || 1)) * 100));
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-700">{student?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{wb?.title}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-indigo-600">{percent}%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{p.currentPage} / {wb?.totalPages}p</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{p.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {state.progress.length === 0 && <p className="p-12 text-center text-slate-400">아직 기록된 진도가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
};

export default LearningStatus;
