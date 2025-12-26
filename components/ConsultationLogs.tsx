
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

  // 초기 로드 시 키 존재 여부 확인
  useEffect(() => {
    const checkKey = async () => {
      // 1. process.env.API_KEY 확인 (Vercel 주입분)
      const envKey = process.env.API_KEY;
      if (envKey && envKey !== "undefined") {
        setIsKeyValid(true);
        return;
      }

      // 2. aistudio 환경 확인
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
      // AI Studio 환경이 아닐 경우 Vercel 설정을 확인하도록 안내
      alert("Vercel 환경 변수 'API_KEY'가 설정되지 않았거나 인식되지 않았습니다. Vercel 배포 설정에서 환경 변수를 추가하고 다시 배포해 주세요.");
    }
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
      setIsKeyValid(true);
    } catch (error: any) {
      console.error("AI Summary Error:", error);
      if (error.message === "INVALID_API_KEY" || error.message === "API_KEY_MISSING") {
        setIsKeyValid(false);
        // 사용자에게 키 선택 기회 제공 (지원 환경인 경우)
        if ((window as any).aistudio) {
          await handleOpenKeySelector();
        } else {
          alert("AI 서비스 연결에 실패했습니다. Vercel 대시보드에서 API_KEY가 올바르게 설정되었는지 확인해 주세요.");
        }
      } else {
        alert(`AI 브리핑 생성 오류: ${error.message}`);
      }
    } finally {
      setIsSummarizing(null);
    }
  };

  const handleCopyToKakao = (studentName: string, text: string) => {
    const today = new Date().toLocaleDateString();
    const fullText = `[EduLog] ${studentName} 학생 리포트 (${today})\n\n${text}`;
    navigator.clipboard.writeText(fullText);
    alert('카톡용 리포트가 복사되었습니다!');
  };

  const isDirector = user?.role === 'DIRECTOR';
  const teacherClasses = isDirector 
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
    updateState(prev => ({ ...prev, consultations: [...prev.consultations, newRecord] }));
    setNote('');
    alert('기록되었습니다.');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">상담 일지 및 AI 브리핑</h2>
          <p className="text-slate-500 text-sm">기록된 메모를 분석해 학부모님용 카톡 리포트를 자동 생성합니다.</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
            isKeyValid 
            ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
            : "bg-amber-50 border-amber-200 text-amber-600"
          }`}>
            {isKeyValid ? "✅ AI 엔진 정상 연결" : "⚠️ AI 설정 확인 필요"}
            {!isKeyValid && (window as any).aistudio && (
              <button onClick={handleOpenKeySelector} className="underline ml-2">키 선택</button>
            )}
          </div>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 hover:underline px-2">결제/요금 안내 ↗</a>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-600">
              <span className="p-1.5 bg-indigo-50 rounded-lg">✍️</span> 관찰 메모 기록
            </h3>
            <form onSubmit={handleAddConsultation} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">대상 학생</label>
                <select 
                  value={studentId} 
                  onChange={e => setStudentId(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50" 
                  required
                >
                  <option value="">학생 선택</option>
                  {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">선생님 소견 (메모)</label>
                <textarea 
                  rows={6} 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm" 
                  placeholder="예: 오늘 숙제 완성도가 매우 높았습니다." 
                  required 
                />
              </div>
              <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">
                기록 저장
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {myStudents.map(student => (
            <div key={student.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-indigo-600 flex items-center justify-center font-bold">
                    {student.name[0]}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">{student.name}</span>
                    <span className="ml-2 text-[10px] font-bold text-slate-400">{student.grade}</span>
                  </div>
                </div>
                
                {isDirector && (
                  <button 
                    onClick={() => handleGenerateAISummary(student.id)}
                    disabled={isSummarizing === student.id}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                      isSummarizing === student.id 
                      ? "bg-indigo-100 text-indigo-400 cursor-not-allowed" 
                      : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                    }`}
                  >
                    {isSummarizing === student.id ? "작성 중..." : "✨ AI 브리핑 생성"}
                  </button>
                )}
              </div>
              
              <div className="p-6">
                {summary[student.id] && (
                  <div className="mb-6 bg-slate-900 text-slate-200 p-6 rounded-3xl relative shadow-2xl border border-slate-800 animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI 추천 브리핑</h4>
                      </div>
                      <button 
                        onClick={() => handleCopyToKakao(student.name, summary[student.id])}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
                      >
                        📋 복사하기
                      </button>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-300 bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                      {summary[student.id]}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">최근 관찰 내역</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.consultations.filter(c => c.studentId === student.id).length === 0 ? (
                      <p className="text-xs text-slate-300 italic">기록된 상담 소견이 없습니다.</p>
                    ) : (
                      state.consultations.filter(c => c.studentId === student.id).reverse().slice(0, 4).map(c => (
                        <div key={c.id} className="text-xs text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-indigo-400">{c.date}</span>
                            <span className="text-[10px] text-slate-300 font-bold">by {state.users.find(u => u.id === c.teacherId)?.name}</span>
                          </div>
                          <p className="leading-relaxed">{c.note}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConsultationLogs;
