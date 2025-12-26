
import React, { useState, useEffect } from 'react';
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
  const [isKeyValid, setIsKeyValid] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      const envKey = process.env.API_KEY;
      if (envKey && envKey !== "undefined") {
        setIsKeyValid(true);
        return;
      }
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeyValid(hasKey);
      } else {
        setIsKeyValid(false);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setIsKeyValid(true);
    } else {
      alert("API_KEY 설정이 필요합니다.");
    }
  };

  const handleGenerateAISummary = async (sId: string) => {
    const student = state.students.find(s => s.id === sId);
    if (!student) return;
    setIsSummarizing(sId);
    try {
      const studentProgress = state.progress.filter(p => p.studentId === sId);
      const studentConsultations = state.consultations.filter(c => c.studentId === sId);
      const result = await generateConsultationSummary(student, studentProgress, state.workbooks, studentConsultations);
      setSummary(prev => ({ ...prev, [sId]: result }));
      setIsKeyValid(true);
    } catch (error: any) {
      console.error("AI Summary Error:", error);
      if (error.message === "INVALID_API_KEY" || error.message === "API_KEY_MISSING") {
        setIsKeyValid(false);
        if ((window as any).aistudio) await handleOpenKeySelector();
      } else {
        alert(`오류: ${error.message}`);
      }
    } finally {
      setIsSummarizing(null);
    }
  };

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
    updateState(prev => ({ ...prev, consultations: [...prev.consultations, newRecord] }));
    setNote('');
    alert('기록되었습니다.');
  };

  const handleDeleteConsultation = (id: string) => {
    if (confirm('이 관찰 기록을 삭제하시겠습니까?')) {
      updateState(prev => ({
        ...prev,
        consultations: prev.consultations.filter(c => c.id !== id)
      }));
    }
  };

  const handleCopyToKakao = (studentName: string, text: string) => {
    const today = new Date().toLocaleDateString();
    const fullText = `[EduLog] ${studentName} 학생 리포트 (${today})\n\n${text}`;
    navigator.clipboard.writeText(fullText);
    alert('카톡용 리포트가 복사되었습니다!');
  };

  const isDirector = user?.role === 'DIRECTOR';
  const teacherClasses = isDirector ? state.classes : state.classes.filter(c => c.teacherId === user?.id);
  const myStudents = state.students.filter(s => teacherClasses.map(c => c.id).includes(s.classId));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">상담 일지 및 AI 브리핑</h2>
          <p className="text-slate-500 text-sm">{isDirector ? "전체 학생의 관찰 메모와 학부모용 리포트를 관리합니다." : "담당 학급 학생들의 관찰 메모를 관리합니다."}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border ${isKeyValid ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-amber-50 border-amber-200 text-amber-600"}`}>
            {isKeyValid ? "✅ AI 엔진 연결됨" : "⚠️ AI 설정 필요"}
            {!isKeyValid && (window as any).aistudio && <button onClick={handleOpenKeySelector} className="underline ml-2">키 선택</button>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-8">
            <h3 className="text-lg font-bold mb-4 text-indigo-600">✍️ 관찰 메모 추가</h3>
            <form onSubmit={handleAddConsultation} className="space-y-4">
              <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50" required>
                <option value="">학생 선택</option>
                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
              <textarea rows={6} value={note} onChange={e => setNote(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm" placeholder="오늘 학생의 특이사항이나 학습 태도를 적어주세요." required />
              <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">저장하기</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {myStudents.map(student => (
            <div key={student.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-indigo-600 flex items-center justify-center font-bold">{student.name[0]}</div>
                  <div>
                    <span className="font-bold text-slate-800">{student.name}</span>
                    <span className="ml-2 text-[10px] font-bold text-slate-400">{student.grade}</span>
                  </div>
                </div>
                {isDirector && (
                  <button onClick={() => handleGenerateAISummary(student.id)} disabled={isSummarizing === student.id} className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${isSummarizing === student.id ? "bg-indigo-100 text-indigo-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"}`}>
                    {isSummarizing === student.id ? "생성 중..." : "✨ AI 브리핑"}
                  </button>
                )}
              </div>
              <div className="p-6">
                {summary[student.id] && (
                  <div className="mb-6 bg-slate-900 text-slate-200 p-6 rounded-3xl relative animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI 추천 브리핑 (데이터 기반)</h4>
                      <button onClick={() => handleCopyToKakao(student.name, summary[student.id])} className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all">📋 복사</button>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">{summary[student.id]}</div>
                  </div>
                )}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">최근 관찰 내역</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.consultations.filter(c => c.studentId === student.id).length === 0 ? (
                      <p className="text-xs text-slate-300 italic">기록 없음</p>
                    ) : (
                      state.consultations.filter(c => c.studentId === student.id).reverse().slice(0, 6).map(c => (
                        <div key={c.id} className="group relative text-xs text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                          <button onClick={() => handleDeleteConsultation(c.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1">✕</button>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-indigo-400">{c.date}</span>
                          </div>
                          <p className="leading-relaxed pr-4">{c.note}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {myStudents.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-100">
               <p className="text-slate-400 font-bold italic">담당하고 있는 학생이 없어 조회할 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationLogs;
