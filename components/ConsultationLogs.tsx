
import React, { useState, useEffect } from 'react';
import { AppState, User, ConsultationRecord } from '../types';
import { generateConsultationSummary } from '../services/geminiService';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const ConsultationLogs: React.FC<Props> = ({ state, updateState, user }) => {
  const [studentId, setStudentId] = useState('');
  const [note, setNote] = useState('');
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [summary, setSummary] = useState<{[key: string]: string}>({});
  const [hasAiKey, setHasAiKey] = useState<boolean>(true);

  useEffect(() => {
    const initCheck = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasAiKey(selected);
      }
    };
    initCheck();
  }, []);

  const handleGenerateAISummary = async (sId: string) => {
    const student = state.students.find(s => s.id === sId);
    if (!student) return;

    // 1. AI 키가 없으면 선택창을 먼저 띄움
    if (window.aistudio) {
      const isKeySelected = await window.aistudio.hasSelectedApiKey();
      if (!isKeySelected) {
        alert('AI 기능을 사용하려면 먼저 구글 프로젝트(API 키)를 선택해야 합니다.\n확인을 누르면 설정창이 열립니다.');
        await window.aistudio.openSelectKey();
        // 규정: openSelectKey 호출 후에는 성공했다고 가정하고 즉시 진행함
        setHasAiKey(true);
      }
    }

    // 2. 즉시 요약 생성 시작 (원장님이 다시 버튼을 누를 필요 없음)
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
      console.error("AI Error:", error);
      if (error.message.includes("BILLING_REQUIRED") || error.message.includes("403")) {
        alert("선택하신 프로젝트에 결제 수단이 등록되지 않았거나 권한이 없습니다.\n구글 클라우드에서 결제 정보를 확인하거나 다른 프로젝트를 선택해 주세요.");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else {
        alert(`AI 생성 중 오류가 발생했습니다: ${error.message}`);
      }
    } finally {
      setIsSummarizing(null);
    }
  };

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
    updateState(prev => ({ ...prev, consultations: [...prev.consultations, newRecord] }));
    setNote('');
    alert('상담 내용이 기록되었습니다.');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">상담 일지</h2>
          <p className="text-slate-500">학생들의 성장을 기록하고 학부모님용 브리핑 문구를 생성합니다.</p>
        </div>
        {!hasAiKey && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3">
            <span className="text-sm text-amber-800 font-medium">⚠️ AI 키 설정이 필요합니다.</span>
            <button 
              onClick={() => window.aistudio?.openSelectKey()}
              className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
            >
              키 설정하기
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 입력 폼 */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">✍️</span> 기록 추가
          </h3>
          <form onSubmit={handleAddConsultation} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">학생 선택</label>
              <select 
                value={studentId} 
                onChange={e => setStudentId(e.target.value)} 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" 
                required
              >
                <option value="">학생을 선택하세요</option>
                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">관찰 및 상담 내용</label>
              <textarea 
                rows={5} 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="아이의 태도, 성취도, 특이사항 등을 기록하세요." 
                required 
              />
            </div>
            <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-all active:scale-95">
              기록 저장
            </button>
          </form>
        </div>

        {/* 목록 및 AI 요약 */}
        <div className="lg:col-span-8 space-y-4">
          {myStudents.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400">담당하는 학생이 없습니다.</p>
            </div>
          )}
          
          {myStudents.map(student => (
            <div key={student.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">{student.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{student.grade}</span>
                </div>
                <button 
                  onClick={() => handleGenerateAISummary(student.id)}
                  disabled={isSummarizing === student.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSummarizing === student.id 
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95"
                  }`}
                >
                  {isSummarizing === student.id ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-slate-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      작성 중...
                    </>
                  ) : (
                    <>✨ AI 브리핑 생성</>
                  )}
                </button>
              </div>
              
              <div className="p-5">
                {summary[student.id] && (
                  <div className="mb-6 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl relative group">
                    <h4 className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">AI 추천 브리핑 문구</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{summary[student.id]}</p>
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => { navigator.clipboard.writeText(summary[student.id]); alert('문구가 클립보드에 복사되었습니다. 카톡 등에 붙여넣기 하세요!'); }}
                        className="flex items-center gap-1.5 text-xs bg-white border border-indigo-200 text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        복사하기
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">최근 관찰 기록</h4>
                  {state.consultations.filter(c => c.studentId === student.id).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">아직 기록된 내용이 없습니다.</p>
                  ) : (
                    state.consultations.filter(c => c.studentId === student.id).reverse().slice(0, 3).map(c => (
                      <div key={c.id} className="text-sm text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400">{c.date}</span>
                        </div>
                        {c.note}
                      </div>
                    ))
                  )}
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
