
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
  const [apiKeyStatus, setApiKeyStatus] = useState<'LOADING' | 'READY' | 'MISSING'>('LOADING');

  useEffect(() => {
    // API 키 로드 상태 체크
    const key = process.env.API_KEY;
    if (key && key !== "undefined") {
      setApiKeyStatus('READY');
    } else {
      setApiKeyStatus('MISSING');
    }
  }, []);

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
      if (error.message === "API_KEY_MISSING_IN_PRODUCTION") {
        alert(
          "⚠️ AI 서비스가 연결되지 않았습니다.\n\n" +
          "해결 방법:\n" +
          "1. Vercel 설정(Settings > Environment Variables)에 접속\n" +
          "2. Key: API_KEY / Value: [구글 AI 키]를 추가\n" +
          "3. 다시 배포(Redeploy)를 해주세요!"
        );
      } else {
        alert(`오류: ${error.message}`);
      }
    } finally {
      setIsSummarizing(null);
    }
  };

  const handleCopyToKakao = (studentName: string, text: string) => {
    const today = new Date().toLocaleDateString();
    const fullText = `[EduLog] ${studentName} 학생 학습 리포트 (${today})\n--------------------------\n\n${text}`;
    navigator.clipboard.writeText(fullText);
    alert('카카오톡 전송용 브리핑이 복사되었습니다!\n학부모님 채팅창에 붙여넣기 하세요.');
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
          <p className="text-slate-500">선생님은 메모를 기록하고, 원장님은 AI로 브리핑을 생성합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          {apiKeyStatus === 'MISSING' && (
            <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-bold border border-rose-200 animate-pulse">
              ⚠️ AI 연결 안됨 (환경변수 확인 필요)
            </div>
          )}
          {apiKeyStatus === 'READY' && (
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> AI 서비스 연결됨
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recording Section (Mainly for Teachers) */}
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
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">관찰 메모 (사실 위주로)</label>
                <textarea 
                  rows={6} 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm" 
                  placeholder="예: 오늘 삼각함수 개념 설명 시 집중력이 좋았음. 숙제 오답풀이 완료." 
                  required 
                />
              </div>
              <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">
                기록 저장
              </button>
            </form>
          </div>
        </div>

        {/* Right: AI Briefing Section (Mainly for Director) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">학생별 학습 현황 및 브리핑</h3>
          </div>
          
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
                        브리핑 생성 중...
                      </span>
                    ) : (
                      <>✨ AI 카톡 브리핑</>
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
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">PREMIUM AI BRIEFING</h4>
                      </div>
                      <button 
                        onClick={() => handleCopyToKakao(student.name, summary[student.id])}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95"
                      >
                        <span>📋 카톡 전송용 복사</span>
                      </button>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-300 bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                      {summary[student.id]}
                    </div>
                  </div>
                ) : (
                  isDirector && (
                    <div className="mb-6 py-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                      <p className="text-xs font-bold">상단 버튼을 눌러 카톡 브리핑 초안을 생성하세요.</p>
                    </div>
                  )
                )}
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    최근 관찰 메모
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.consultations.filter(c => c.studentId === student.id).length === 0 ? (
                      <p className="text-xs text-slate-300 italic">기록된 내용이 없습니다.</p>
                    ) : (
                      state.consultations.filter(c => c.studentId === student.id).reverse().slice(0, 4).map(c => (
                        <div key={c.id} className="text-xs text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-indigo-400">{c.date}</span>
                            <span className="text-[10px] text-slate-300 font-bold uppercase">by {state.users.find(u => u.id === c.teacherId)?.name}</span>
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
