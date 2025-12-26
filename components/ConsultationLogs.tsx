
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
  const [isAiStudioEnv, setIsAiStudioEnv] = useState(false);

  useEffect(() => {
    setIsAiStudioEnv(!!(window as any).aistudio);
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
      if (error.message === "API_KEY_NOT_CONFIGURED") {
        alert(
          "AI 기능이 작동하지 않습니다!\n\n" +
          "현재 Vercel(배포 환경)에서 사용 중이시라면:\n" +
          "1. Vercel Dashboard 접속\n" +
          "2. Project Settings > Environment Variables 이동\n" +
          "3. Key: API_KEY, Value: [구글 AI 키] 입력\n" +
          "4. 사이트 재배포(Redeploy)를 진행해 주세요."
        );
      } else {
        alert(`오류가 발생했습니다: ${error.message}`);
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
    alert('상담 내용이 저장되었습니다.');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">상담 일지</h2>
          <p className="text-slate-500">학생 관찰 기록과 AI 학부모 브리핑을 관리합니다.</p>
        </div>
        {isAiStudioEnv && (
          <button 
            onClick={() => (window as any).aistudio?.openSelectKey()}
            className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors border border-amber-200"
          >
            🔑 개발용 AI 키 설정
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit sticky top-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">✍️</span> 기록 추가
          </h3>
          <form onSubmit={handleAddConsultation} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">학생 선택</label>
              <select 
                value={studentId} 
                onChange={e => setStudentId(e.target.value)} 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50" 
                required
              >
                <option value="">학생을 선택하세요</option>
                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">오늘의 관찰 메모</label>
              <textarea 
                rows={6} 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm" 
                placeholder="태도, 성취도, 특이사항 등을 자유롭게 적어주세요. AI가 이 내용을 분석합니다." 
                required 
              />
            </div>
            <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">
              기록 저장
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {myStudents.map(student => (
            <div key={student.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4 bg-slate-50/80 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {student.name[0]}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">{student.name}</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">{student.grade}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleGenerateAISummary(student.id)}
                  disabled={isSummarizing === student.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isSummarizing === student.id 
                    ? "bg-indigo-100 text-indigo-400 cursor-not-allowed" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                  }`}
                >
                  {isSummarizing === student.id ? (
                    <>
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      AI 요약 중...
                    </>
                  ) : (
                    <>✨ AI 브리핑 생성</>
                  )}
                </button>
              </div>
              
              <div className="p-5">
                {summary[student.id] && (
                  <div className="mb-6 bg-slate-900 text-slate-100 p-6 rounded-2xl relative shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        AI RECOMMENDATION
                      </h4>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(summary[student.id]); alert('복사되었습니다!'); }}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 transition-colors"
                      >
                        텍스트 복사
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium font-sans">{summary[student.id]}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">최근 관찰 타임라인</h4>
                  <div className="space-y-2">
                    {state.consultations.filter(c => c.studentId === student.id).length === 0 ? (
                      <p className="text-xs text-slate-300 italic py-2">아직 기록된 내용이 없습니다.</p>
                    ) : (
                      state.consultations.filter(c => c.studentId === student.id).reverse().slice(0, 3).map(c => (
                        <div key={c.id} className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex gap-3">
                          <span className="font-bold text-indigo-300 whitespace-nowrap">{c.date.slice(5)}</span>
                          <span className="flex-1">{c.note}</span>
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
