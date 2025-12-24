
import React, { useState } from 'react';
import { AppState, User, ConsultationRecord } from '../types';
import { generateConsultationSummary } from '../services/geminiService';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const ConsultationLogs: React.FC<Props> = ({ state, updateState, user }) => {
  const [studentId, setStudentId] = useState('');
  const [note, setNote] = useState('');
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [summary, setSummary] = useState<{[key: string]: string}>({});

  const teacherClasses = user?.role === 'DIRECTOR' 
    ? state.classes 
    : state.classes.filter(c => c.teacherId === user?.id);
  const myStudents = state.students.filter(s => teacherClasses.map(c => c.id).includes(s.classId));

  const handleAddConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !note || !user) return;

    const newRecord: ConsultationRecord = {
      id: 'cn' + Date.now(),
      studentId,
      teacherId: user.id,
      note,
      date: new Date().toISOString().split('T')[0]
    };

    updateState(prev => ({
      ...prev,
      consultations: [...prev.consultations, newRecord]
    }));

    setNote('');
    alert('상담 일지가 등록되었습니다.');
  };

  const handleGenerateAISummary = async (sId: string) => {
    const student = state.students.find(s => s.id === sId);
    if (!student) return;

    setIsSummarizing(sId);
    const studentProgress = state.progress.filter(p => p.studentId === sId);
    const studentConsultations = state.consultations.filter(c => c.studentId === sId);
    
    const result = await generateConsultationSummary(student, studentProgress, state.workbooks, studentConsultations);
    setSummary(prev => ({ ...prev, [sId]: result }));
    setIsSummarizing(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">상담 일지</h2>
        <p className="text-slate-500">학생 상담 내용을 기록하고 AI로 요약해보세요.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit sticky top-8">
          <h3 className="text-lg font-bold mb-4 text-slate-800">상담 기록 추가</h3>
          <form onSubmit={handleAddConsultation} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">학생</label>
              <select 
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              >
                <option value="">학생 선택</option>
                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">상담 내용</label>
              <textarea 
                rows={5}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="오늘의 수업 태도, 성취도, 특이사항 등을 기록하세요."
                required
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 shadow-md">
              일지 등록
            </button>
          </form>
        </div>

        {/* List & AI Feature */}
        <div className="lg:col-span-8 space-y-6">
          {myStudents.map(student => {
            const history = state.consultations.filter(c => c.studentId === student.id).reverse();
            return (
              <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{student.name} 학생</h4>
                    <p className="text-xs text-slate-500">{student.grade}</p>
                  </div>
                  <button 
                    onClick={() => handleGenerateAISummary(student.id)}
                    disabled={isSummarizing === student.id}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                      isSummarizing === student.id 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    <span>✨ {isSummarizing === student.id ? '요약 중...' : '학부모 전송용 요약'}</span>
                  </button>
                </div>

                <div className="p-6">
                  {summary[student.id] && (
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl relative">
                      <h5 className="text-sm font-bold text-indigo-700 mb-2 flex items-center italic">
                        <span className="mr-2">✨</span> AI 요약 브리핑
                      </h5>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{summary[student.id]}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(summary[student.id]);
                          alert('클립보드에 복사되었습니다.');
                        }}
                        className="absolute top-4 right-4 text-xs text-indigo-500 hover:text-indigo-700 underline"
                      >
                        복사하기
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {history.length > 0 ? (
                      history.map(c => (
                        <div key={c.id} className="border-l-4 border-indigo-200 pl-4 py-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-semibold text-slate-400">{c.date}</span>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">교사: {state.users.find(u => u.id === c.teacherId)?.name}</span>
                          </div>
                          <p className="text-sm text-slate-700">{c.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 py-8 text-sm italic">기록된 상담 내용이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConsultationLogs;
