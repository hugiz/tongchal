
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
    
    try {
      const studentProgress = state.progress.filter(p => p.studentId === sId);
      const studentConsultations = state.consultations.filter(c => c.studentId === sId);
      
      const result = await generateConsultationSummary(
        student, 
        studentProgress, 
        state.workbooks, 
        studentConsultations
      );
      
      setSummary(prev => ({ ...prev, [sId]: result }));
    } catch (error) {
      console.error("Summary generation error:", error);
      alert("AI 요약 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      // 성공하든 실패하든 로딩 상태는 반드시 해제하여 버튼을 다시 활성화함
      setIsSummarizing(null);
    }
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
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm ${
                      isSummarizing === student.id 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed animate-pulse' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-indigo-200 hover:shadow-lg active:scale-95'
                    }`}
                  >
                    {isSummarizing === student.id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        작성 중...
                      </>
                    ) : (
                      <span>✨ 학부모 전송용 요약</span>
                    )}
                  </button>
                </div>

                <div className="p-6">
                  {summary[student.id] && (
                    <div className="mb-6 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl relative animate-in fade-in zoom-in duration-300">
                      <h5 className="text-sm font-bold text-indigo-700 mb-3 flex items-center">
                        <span className="mr-2 text-lg">✨</span> AI 학습 브리핑 (복사하여 전송하세요)
                      </h5>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white/50 p-4 rounded-xl border border-indigo-50">
                        {summary[student.id]}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(summary[student.id]);
                          alert('내용이 클립보드에 복사되었습니다! 카톡이나 문자에 붙여넣어 전송하세요.');
                        }}
                        className="mt-3 w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-colors"
                      >
                        문구 복사하기
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
                      <p className="text-center text-slate-400 py-8 text-sm italic">기록된 상담 내용이 없습니다. 먼저 왼쪽에서 일지를 작성해 주세요.</p>
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
