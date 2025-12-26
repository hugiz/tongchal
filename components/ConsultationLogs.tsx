
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

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else if (process.env.API_KEY) {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      // 가이드라인에 따라 선택 직후 성공으로 가정하고 진행
      setHasKey(true);
    } else {
      alert("배포 환경에서 AI 기능을 사용하려면 원장님의 API 키 설정이 필요합니다.");
    }
  };

  const handleGenerateAISummary = async (sId: string) => {
    // 1. 키가 없는 경우 선택창 먼저 오픈
    if (!hasKey && (window as any).aistudio) {
      await handleOpenKeySelector();
    }

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
      
      // 2. 키 오류 발생 시 재설정 유도 (가이드라인 준수)
      if (error.message === "INVALID_API_KEY" || error.message === "API_KEY_MISSING") {
        setHasKey(false);
        if ((window as any).aistudio) {
          alert("AI 서비스 연결에 문제가 발생했습니다. 다시 한번 키를 선택해 주세요.");
          await handleOpenKeySelector();
        } else {
          alert("API 키가 설정되지 않았거나 유효하지 않습니다. 환경 변수를 확인해 주세요.");
        }
      } else {
        alert(`AI 브리핑 생성 중 오류가 발생했습니다: ${error.message}`);
      }
    } finally {
      setIsSummarizing(null);
    }
  };

  const handleCopyToKakao = (studentName: string, text: string) => {
    const today = new Date().toLocaleDateString();
    const fullText = `[EduLog] ${studentName} 학생 학습 리포트 (${today})\n--------------------------\n\n${text}`;
    navigator.clipboard.writeText(fullText);
    alert('카카오톡 전송용 문구가 복사되었습니다!');
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
    alert('관찰 메모가 저장되었습니다.');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">상담 일지 및 AI 브리핑</h2>
          <p className="text-slate-500 text-sm">기록된 메모를 분석해 카카오톡용 보고서를 생성합니다.</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <button 
            onClick={handleOpenKeySelector}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
              hasKey 
              ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
              : "bg-amber-50 border-amber-200 text-amber-600 animate-pulse"
            }`}
          >
            {hasKey ? "✅ AI 서비스 연결됨" : "🔑 AI 서비스 연결 필요 (클릭)"}
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noreferrer"
            className="text-[10px] text-slate-400 hover:underline px-2"
          >
            결제 및 요금 안내 확인하기 ↗
          </a>
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
                  placeholder="예: 오늘 숙제 완성도가 매우 높았습니다. 어려운 응용 문제도 스스로 잘 해결해냈습니다." 
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
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
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
                    {isSummarizing === student.id ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        생성 중...
                      </span>
                    ) : (
                      <>✨ 카톡 브리핑 생성</>
                    )}
                  </button>
                )}
              </div>
              
              <div className="p-6">
                {summary[student.id] ? (
                  <div className="mb-6 bg-slate-900 text-slate-200 p-6 rounded-3xl relative shadow-2xl border border-slate-800 animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI 추천 브리핑 (카톡용)</h4>
                      </div>
                      <button 
                        onClick={() => handleCopyToKakao(student.name, summary[student.id])}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95"
                      >
                        <span>📋 전체 복사하기</span>
                      </button>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-300 bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                      {summary[student.id]}
                    </div>
                  </div>
                ) : (
                  isDirector && (
                    <div className="mb-6 py-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                      <p className="text-xs font-bold">선생님들의 메모를 바탕으로 AI 브리핑을 생성해 보세요.</p>
                      {!hasKey && <p className="text-[10px] mt-2 text-rose-400 font-bold italic">※ 먼저 상단의 'AI 서비스 연결' 버튼을 눌러주세요.</p>}
                    </div>
                  )
                )}
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">기록된 관찰 소견</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.consultations.filter(c => c.studentId === student.id).length === 0 ? (
                      <p className="text-xs text-slate-300 italic">최근 기록된 소견이 없습니다.</p>
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
