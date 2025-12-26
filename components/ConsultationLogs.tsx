
import React, { useState, useEffect } from 'react';
import { AppState, User, ConsultationRecord, ParentConsultationRecord, ConsultationType } from '../types';
import { generateConsultationSummary } from '../services/geminiService';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const ConsultationLogs: React.FC<Props> = ({ state, updateState, user }) => {
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'OBSERVATION' | 'PARENT_CONSULT'>('OBSERVATION');
  
  // 관찰 메모 상태
  const [note, setNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // AI 요약 상태
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [summary, setSummary] = useState<{[key: string]: string}>({});
  const [isKeyValid, setIsKeyValid] = useState(true);

  // 학부모 상담 폼 상태
  const [consultType, setConsultType] = useState<ConsultationType>('PHONE');
  const [consultContent, setConsultContent] = useState('');
  const [consultResult, setConsultResult] = useState('');
  const [editingParentConsultId, setEditingParentConsultId] = useState<string | null>(null);

  const isDirector = user?.role === 'DIRECTOR';

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
    } catch (error: any) {
      if (error.message === "INVALID_API_KEY" || error.message === "API_KEY_MISSING") {
        setIsKeyValid(false);
        await handleOpenKeySelector();
      }
    } finally {
      setIsSummarizing(null);
    }
  };

  const handleAddOrUpdateConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentId || !note || !user) return;

    if (editingNoteId) {
      updateState(prev => ({
        ...prev,
        consultations: (prev.consultations || []).map(c => 
          c.id === editingNoteId ? { ...c, note } : c
        )
      }));
      setEditingNoteId(null);
      alert('메모 수정 완료');
    } else {
      const newRecord: ConsultationRecord = {
        id: 'cn' + Date.now(),
        studentId: activeStudentId,
        teacherId: user.id,
        note,
        date: new Date().toISOString().split('T')[0]
      };
      updateState(prev => ({ ...prev, consultations: [...(prev.consultations || []), newRecord] }));
      alert('관찰 메모 저장 완료');
    }
    setNote('');
  };

  const handleDeleteConsultation = (id: string) => {
    if (confirm('이 관찰 메모를 삭제하시겠습니까?')) {
      updateState(prev => ({
        ...prev,
        consultations: (prev.consultations || []).filter(c => c.id !== id)
      }));
    }
  };

  const startEditConsultation = (record: ConsultationRecord) => {
    setNote(record.note);
    setEditingNoteId(record.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddOrUpdateParentConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentId || !consultContent || !isDirector) return;

    if (editingParentConsultId) {
      updateState(prev => ({
        ...prev,
        parentConsultations: (prev.parentConsultations || []).map(c => 
          c.id === editingParentConsultId ? { ...c, type: consultType, content: consultContent, result: consultResult } : c
        )
      }));
      setEditingParentConsultId(null);
      alert('상담 기록 수정 완료');
    } else {
      const newRecord: ParentConsultationRecord = {
        id: 'pc' + Date.now(),
        studentId: activeStudentId,
        type: consultType,
        content: consultContent,
        result: consultResult,
        date: new Date().toISOString().split('T')[0]
      };
      updateState(prev => ({ ...prev, parentConsultations: [...(prev.parentConsultations || []), newRecord] }));
      alert('학부모 심층 상담 기록 완료');
    }
    setConsultContent('');
    setConsultResult('');
  };

  const handleDeleteParentConsultation = (id: string) => {
    if (confirm('이 상담 기록을 삭제하시겠습니까?')) {
      updateState(prev => ({ ...prev, parentConsultations: (prev.parentConsultations || []).filter(c => c.id !== id) }));
    }
  };

  const startEditParentConsultation = (record: ParentConsultationRecord) => {
    setConsultType(record.type);
    setConsultContent(record.content);
    setConsultResult(record.result);
    setEditingParentConsultId(record.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyToKakao = (studentName: string, text: string) => {
    const fullText = `[통찰Edulog] ${studentName} 학생 리포트\n\n${text}`;
    navigator.clipboard.writeText(fullText);
    alert('카카오톡용 리포트가 클립보드에 복사되었습니다.');
  };

  const teacherClasses = isDirector ? state.classes : state.classes.filter(c => c.teacherId === user?.id);
  const myStudents = state.students.filter(s => teacherClasses.map(c => c.id).includes(s.classId));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">상담 및 관찰 일지</h2>
          <p className="text-slate-500 text-sm">{isDirector ? "학생별 관찰 메모와 학부모 심층 상담을 관리합니다." : "담당 학급 학생들의 관찰 메모를 관리합니다."}</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black border ${isKeyValid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
          {isKeyValid ? "● AI 엔진 활성화됨" : "○ AI 설정 필요"}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 학생 목록 사이드바 */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">학생 리스트</h3>
          {myStudents.map(s => (
            <button key={s.id} onClick={() => { setActiveStudentId(s.id); setEditingNoteId(null); setEditingParentConsultId(null); }} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeStudentId === s.id ? "bg-white border-indigo-400 shadow-lg ring-4 ring-indigo-50" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${activeStudentId === s.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>{s.name[0]}</div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-800">{s.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{s.grade}</p>
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-300">#{s.id.slice(-4)}</span>
            </button>
          ))}
        </div>

        {/* 상담 상세 영역 */}
        <div className="lg:col-span-8">
          {activeStudentId ? (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
              {/* 탭 헤더 */}
              <div className="flex border-b border-slate-50">
                <button onClick={() => setViewTab('OBSERVATION')} className={`flex-1 py-4 text-xs font-black transition-all ${viewTab === 'OBSERVATION' ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30" : "text-slate-400 hover:text-slate-600"}`}>관찰 메모 및 AI 리포트</button>
                <button onClick={() => setViewTab('PARENT_CONSULT')} className={`flex-1 py-4 text-xs font-black transition-all ${viewTab === 'PARENT_CONSULT' ? "text-rose-600 border-b-2 border-rose-600 bg-rose-50/30" : "text-slate-400 hover:text-slate-600"}`}>학부모 심층 상담 {isDirector && "⭐"}</button>
              </div>

              <div className="p-8">
                {viewTab === 'OBSERVATION' ? (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span> 
                        {editingNoteId ? "관찰 메모 수정 중" : "관찰 메모 등록"}
                      </h4>
                      {isDirector && !editingNoteId && (
                        <button onClick={() => handleGenerateAISummary(activeStudentId)} disabled={isSummarizing === activeStudentId} className={`px-4 py-2 rounded-xl text-[10px] font-black shadow-sm transition-all ${isSummarizing === activeStudentId ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"}`}>
                          {isSummarizing === activeStudentId ? "생성 중..." : "✨ AI 브리핑 생성"}
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleAddOrUpdateConsultation} className="relative">
                      <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className={`w-full p-5 rounded-2xl bg-slate-50 border outline-none text-sm font-medium transition-all ${editingNoteId ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-100 focus:ring-4 focus:ring-indigo-500/5'}`} placeholder="학생의 오늘 학습 태도나 특이사항을 기록해 주세요." required />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        {editingNoteId && (
                          <button type="button" onClick={() => { setEditingNoteId(null); setNote(''); }} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-300 transition-all">취소</button>
                        )}
                        <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-700 transition-all">
                          {editingNoteId ? "수정 완료" : "메모 저장"}
                        </button>
                      </div>
                    </form>

                    {summary[activeStudentId] && (
                      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI 분석 보고서</p>
                          <button onClick={() => handleCopyToKakao(state.students.find(s=>s.id===activeStudentId)?.name || '', summary[activeStudentId])} className="text-[10px] font-black text-white bg-indigo-600 px-3 py-1.5 rounded-lg">📋 카톡 복사</button>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{summary[activeStudentId]}</div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">누적 관찰 내역</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {state.consultations.filter(c => c.studentId === activeStudentId).reverse().map(c => (
                          <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-600 leading-relaxed relative group/note">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-indigo-500 font-black">{c.date}</span>
                              <div className="flex gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                <button onClick={() => startEditConsultation(c)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-indigo-500 hover:bg-indigo-50" title="수정">✏️</button>
                                <button onClick={() => handleDeleteConsultation(c.id)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50" title="삭제">🗑️</button>
                              </div>
                            </div>
                            {c.note}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span> 
                      {editingParentConsultId ? "심층 상담 수정 중" : "학부모 심층 상담 관리"}
                    </h4>

                    {isDirector ? (
                      <form onSubmit={handleAddOrUpdateParentConsultation} className={`p-6 rounded-[28px] border space-y-4 transition-all ${editingParentConsultId ? 'bg-amber-50 border-amber-200 ring-4 ring-amber-50' : 'bg-rose-50/50 border-rose-100'}`}>
                        <div className="flex flex-wrap gap-2">
                          {(['PHONE', 'VISIT', 'MESSAGE', 'OTHER'] as ConsultationType[]).map(t => (
                            <button key={t} type="button" onClick={() => setConsultType(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${consultType === t ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"}`}>
                              {t === 'PHONE' ? '📞 전화' : t === 'VISIT' ? '🏫 방문' : t === 'MESSAGE' ? '✉️ 문자' : '📎 기타'}
                            </button>
                          ))}
                        </div>
                        <textarea value={consultContent} onChange={e => setConsultContent(e.target.value)} placeholder="상담한 주요 내용을 입력하세요." rows={3} className="w-full p-4 rounded-2xl border border-rose-100 outline-none text-xs font-medium focus:ring-4 focus:ring-rose-500/5" required />
                        <input value={consultResult} onChange={e => setConsultResult(e.target.value)} placeholder="상담 결과 (진급 결정, 교재 변경 등)" className="w-full p-4 rounded-2xl border border-rose-100 outline-none text-xs font-medium focus:ring-4 focus:ring-rose-500/5" />
                        <div className="flex gap-2">
                          {editingParentConsultId && (
                            <button type="button" onClick={() => { setEditingParentConsultId(null); setConsultContent(''); setConsultResult(''); }} className="flex-1 bg-slate-200 text-slate-600 py-3 rounded-2xl text-[11px] font-black hover:bg-slate-300 transition-all">수정 취소</button>
                          )}
                          <button type="submit" className={`flex-[2] text-white py-3 rounded-2xl text-[11px] font-black shadow-lg transition-all ${editingParentConsultId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                            {editingParentConsultId ? '기록 수정 완료' : '상담 기록 저장'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 font-bold italic">학부모 심층 상담은 원장님 전용 메뉴입니다.</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">누적 상담 히스토리</h5>
                      <div className="space-y-3">
                        {(state.parentConsultations || []).filter(c => c.studentId === activeStudentId).reverse().map(c => (
                          <div key={c.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative group/parent">
                            {isDirector && (
                              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover/parent:opacity-100 transition-all">
                                <button onClick={() => startEditParentConsultation(c)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100" title="수정">✏️</button>
                                <button onClick={() => handleDeleteParentConsultation(c.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-100" title="삭제">🗑️</button>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black text-white ${c.type === 'PHONE' ? 'bg-indigo-500' : c.type === 'VISIT' ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                {c.type === 'PHONE' ? '전화 상담' : c.type === 'VISIT' ? '대면 상담' : c.type === 'MESSAGE' ? '문자 상담' : '기타 상담'}
                              </span>
                              <span className="text-[10px] font-black text-slate-400">{c.date}</span>
                            </div>
                            <p className="text-xs text-slate-700 font-bold leading-relaxed mb-3">{c.content}</p>
                            {c.result && (
                              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">상담 결과/피드백</p>
                                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">{c.result}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {(state.parentConsultations || []).filter(c => c.studentId === activeStudentId).length === 0 && (
                          <p className="text-center py-10 text-xs text-slate-300 font-bold italic">등록된 심층 상담 기록이 없습니다.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[40px] border border-dashed border-slate-200">
              <span className="text-4xl mb-4">👥</span>
              <p className="text-slate-400 font-black italic">상담을 진행할 학생을 왼쪽에서 선택해 주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationLogs;
