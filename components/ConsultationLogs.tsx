
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
  const [hasKey, setHasKey] = useState(false);

  // 환경 변수나 AI 스튜디오에서 키가 있는지 확인
  useEffect(() => {
    const checkKeyStatus = async () => {
      let keyAvailable = false;
      
      // 1. AI 스튜디오 환경인 경우
      if ((window as any).aistudio) {
        keyAvailable = await (window as any).aistudio.hasSelectedApiKey();
      }
      
      // 2. Vercel 등 일반 환경 변수인 경우 (문자열 "undefined" 방지)
      if (!keyAvailable && process.env.API_KEY && process.env.API_KEY !== "undefined") {
        keyAvailable = true;
      }
      
      setHasKey(keyAvailable);
    };
    checkKeyStatus();
  }, []);

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    } else {
      // 일반 브라우저에서는 환경 변수를 쓰므로 별도 창을 띄울 수 없음
      alert("현재 Vercel 환경 변수를 통해 AI 서비스에 연결을 시도하고 있습니다. 만약 작동하지 않는다면 Vercel 설정에서 API_KEY가 정확한지 확인해 주세요.");
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
    } catch (error: any) {
      console.error("AI Summary Error:", error);
      if (error.message === "API_KEY_MISSING" || error.message === "INVALID_API_KEY") {
        setHasKey(false);
        alert("AI 키가 설정되지 않았거나 유효하지 않습니다. Vercel 환경 변수 설정을 확인해 주세요.");
      } else {
        alert(`오류 발생: ${error.message}`);
      }
    } finally {
      setIsSummarizing(null);
    }
  };

  const handleCopyToKakao = (studentName: string, text: string) => {
    const today = new Date().toLocaleDateString();
    const fullText = `[EduLog] ${studentName} 리포트 (${today})\n\n${text}`;
    navigator.clipboard.writeText(fullText);
    alert('복사되었습니다! 카카오톡에 붙여넣으세요.');
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
    alert('저장되었습니다.');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">상담 일지 및 AI 브리핑</h2>
          <p className="text-slate-500 text-sm">기록된 내용을 바탕으로 학부모 보고서를 생성합니다.</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <button 
            onClick={handleOpenKeySelector}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
              hasKey 
              ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
              : "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
            }`}
          >
            {hasKey ? "✅ AI 엔진 연결됨" : "⚠️ AI 설정 확인 필요"}
          </button>
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
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">오늘의 관찰 소견</label>
                <textarea 
                  rows={6} 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm" 
                  placeholder="아이의 학습 태도나 특이사항을 적어주세요." 
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
                    <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">{student.grade}</span>
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
                    {isSummarizing === student.id ? "생성 중..." : "✨ AI 카톡 브리핑"}
                  </button>
                )}
              </div>
              
              <div className="p-6">
                {summary[student.id] && (
                  <div className="mb-6 bg-slate-900 text-slate-200 p-6 rounded-3xl relative shadow-2xl border border-slate-800 animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI 추천 브리핑</h4>
                      <button 
                        onClick={() => handleCopyToKakao(student.name, summary[student.id])}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        📋 카톡용 복사
                      </button>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300 bg-slate-800/50 p-5 rounded-2xl">
                      {summary[student.id]}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">최근 관찰 기록</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.consultations.filter(c => c.studentId === student.id).length === 0 ? (
                      <p className="text-xs text-slate-300 italic">기록이 없습니다.</p>
                    ) : (
                      state.consultations.filter(c => c.studentId === student.id).reverse().slice(0, 4).map(c => (
                        <div key={c.id} className="text-xs text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-indigo-400">{c.date}</span>
                            <span className="text-[10px] text-slate-300">by {state.users.find(u => u.id === c.teacherId)?.name}</span>
                          </div>
                          <p>{c.note}</p>
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
