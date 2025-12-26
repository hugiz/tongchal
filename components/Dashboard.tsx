
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, User, Student, AttendanceStatus, ProgressRecord, ConsultationRecord, MakeupRecord, BriefingRecord } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ state, updateState, user }) => {
  const [activeActionClass, setActiveActionClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'LEARNING' | 'CONSULTATION'>('ATTENDANCE');
  const [selectedWorkbooks, setSelectedWorkbooks] = useState<{[key: string]: string}>({});

  const navigate = useNavigate();
  const isDirector = user?.role === 'DIRECTOR';
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dayName = DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1]; // 월(0)~일(6)

  const visibleClasses = isDirector 
    ? (state.classes || []) 
    : (state.classes || []).filter(c => c.teacherId === user?.id);
  
  const visibleClassIds = visibleClasses.map(c => c.id);
  const visibleStudents = (state.students || []).filter(s => visibleClassIds.includes(s.classId));
  const visibleStudentIds = visibleStudents.map(s => s.id);

  const expectedStudents = visibleStudents.filter(s => (s.attendanceDays || []).includes(dayName));
  const expectedCount = expectedStudents.length;

  const presentStudentsToday = (state.attendance || []).filter(a => a.date === today && (a.status === 'PRESENT' || a.status === 'LATE') && visibleStudentIds.includes(a.studentId));
  const presentCount = presentStudentsToday.length;

  // 오늘 보강 학생
  const makeupsToday = (state.makeups || []).filter(m => m.makeupDate === today && visibleStudentIds.includes(m.studentId));

  // 최근 상담 브리핑 (최대 3개)
  const recentBriefings = (state.briefings || [])
    .filter(b => visibleStudentIds.includes(b.studentId))
    .slice(0, 3);

  const gradeData = visibleStudents.reduce((acc: any[], s) => {
    const existing = acc.find(item => item.name === s.grade);
    if (existing) { existing.value += 1; } 
    else { acc.push({ name: s.grade, value: 1 }); }
    return acc;
  }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

  const handleAttendance = (studentId: string, classId: string, status: AttendanceStatus) => {
    updateState(prev => {
      const existingIdx = (prev.attendance || []).findIndex(a => a.studentId === studentId && a.date === today);
      const newAttendance = [...(prev.attendance || [])];
      if (existingIdx > -1) {
        newAttendance[existingIdx] = { ...newAttendance[existingIdx], status };
      } else {
        newAttendance.push({ id: 'at' + Date.now() + Math.random(), studentId, classId, date: today, status });
      }
      return { ...prev, attendance: newAttendance };
    });
  };

  const handleUpdateProgress = (studentId: string, workbookId: string, pageStr: string) => {
    const page = parseInt(pageStr);
    if (!workbookId) {
      alert('공부한 문제집을 먼저 선택해 주세요.');
      return;
    }
    if (isNaN(page) || page <= 0) {
      alert('진행한 페이지 번호를 정확히 입력해 주세요.');
      return;
    }
    const newProgress: ProgressRecord = { 
      id: 'p' + Date.now() + Math.random(), 
      studentId, 
      workbookId, 
      currentPage: page, 
      date: today 
    };
    updateState(prev => ({ ...prev, progress: [...(prev.progress || []), newProgress] }));
    alert('학습 기록이 저장되었습니다.');
  };

  const greetingName = isDirector 
    ? "원장님" 
    : `${user?.name || '선생'}${user?.name?.endsWith('님') || user?.name?.endsWith('선생님') ? '' : ' 선생님'}`;

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">안녕하세요, {greetingName} 👋</h2>
          <p className="text-slate-500 font-medium mt-1">{isDirector ? "학원 전체 현황을 브리핑합니다." : "담당하고 계신 반의 오늘의 현황입니다."}</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r pr-3 border-slate-100">Today</span>
          <span className="text-sm font-black text-indigo-600 pl-1">{today}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={isDirector ? "전체 원생" : "담당 원생"} value={visibleStudents.length} icon="👥" color="bg-indigo-600" />
        <StatCard title="담당 학급" value={visibleClasses.length} icon="🏫" color="bg-emerald-600" />
        <StatCard title="오늘 등원" value={`${presentCount} / ${expectedCount}`} icon="✅" color="bg-amber-500" />
        <StatCard title="오늘 보강" value={makeupsToday.length} icon="🩹" color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
              <span className="w-2.5 h-8 bg-indigo-600 rounded-full"></span>
              학급별 업무 관리
            </h3>
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-amber-300"></span> 오늘 수업 반 강조됨
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleClasses.map(cls => {
              const classStudents = visibleStudents.filter(s => s.classId === cls.id);
              const presentCountClass = (state.attendance || []).filter(a => a.classId === cls.id && a.date === today && (a.status === 'PRESENT' || a.status === 'LATE')).length;
              const expectedCountClass = classStudents.filter(s => (s.attendanceDays || []).includes(dayName)).length;
              const isSelected = activeActionClass === cls.id;
              const isClassToday = (cls.attendanceDays || []).includes(dayName);

              return (
                <div key={cls.id} className={`bg-white rounded-[32px] border transition-all overflow-hidden relative group/card ${isSelected ? 'border-indigo-500 shadow-2xl ring-4 ring-indigo-50' : isClassToday ? 'border-amber-200 bg-amber-50/80 shadow-md shadow-amber-200/20' : 'border-slate-100 hover:shadow-xl'}`}>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl font-black transition-all ${isClassToday ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-50 text-indigo-400 shadow-slate-100'}`}>
                          {cls.name[0]}
                        </div>
                        {isClassToday && (
                          <div className="whitespace-nowrap">
                            <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm animate-pulse">✨ 오늘 수업</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-wider ${isClassToday ? 'bg-white border border-amber-200 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                          {presentCountClass}/{expectedCountClass} 등원
                        </span>
                      </div>
                    </div>
                    <h4 className="font-black text-slate-800 text-xl mb-1 mt-2">{cls.name}</h4>
                    <p className="text-xs text-slate-400 mb-8 font-bold">담당: {state.users.find(u => u.id === cls.teacherId)?.name} 선생님</p>
                    <div className="grid grid-cols-3 gap-2 relative z-10">
                      <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'ATTENDANCE' ? null : cls.id); setActiveTab('ATTENDANCE'); }} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${isSelected && activeTab === 'ATTENDANCE' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-slate-600'}`}>출석</button>
                      <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'LEARNING' ? null : cls.id); setActiveTab('LEARNING'); }} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${isSelected && activeTab === 'LEARNING' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-100 text-slate-600'}`}>학습</button>
                      <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'CONSULTATION' ? null : cls.id); setActiveTab('CONSULTATION'); }} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${isSelected && activeTab === 'CONSULTATION' ? 'bg-rose-600 text-white' : 'bg-white border border-slate-100 text-slate-600'}`}>상담</button>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="border-t border-slate-50 p-6 bg-slate-50/50">
                      <div className="space-y-3">
                        {classStudents.map(student => {
                          const studentClass = state.classes.find(c => c.id === student.classId);
                          const classWorkbooks = state.workbooks.filter(w => (studentClass?.workbooks || []).includes(w.id));
                          const individualWorkbooks = state.workbooks.filter(w => (student.workbooks || []).includes(w.id));
                          const allAvailableWbs = [...classWorkbooks, ...individualWorkbooks];
                          const currentSelectedWbId = selectedWorkbooks[student.id] || (allAvailableWbs[0]?.id || '');
                          const isExpected = (student.attendanceDays || []).includes(dayName);

                          return (
                            <div key={student.id} className={`bg-white p-4 rounded-2xl border flex items-center justify-between gap-3 ${!isExpected ? 'opacity-50 grayscale' : 'border-slate-100'}`}>
                              <div className="min-w-[70px]">
                                <span className="text-sm font-black text-slate-800 block">{student.name}</span>
                                {!isExpected && <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">비수업일</span>}
                              </div>
                              {activeTab === 'ATTENDANCE' && (
                                <div className="flex gap-1">
                                  {['PRESENT', 'LATE', 'ABSENT'].map(status => {
                                    const att = (state.attendance || []).find(a => a.studentId === student.id && a.date === today);
                                    const activeColor = status === 'PRESENT' ? 'bg-emerald-500' : status === 'LATE' ? 'bg-amber-500' : 'bg-rose-500';
                                    return (
                                      <button key={status} onClick={() => handleAttendance(student.id, cls.id, status as AttendanceStatus)} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black ${att?.status === status ? `${activeColor} text-white shadow-lg` : 'bg-slate-50 text-slate-400'}`}>{status === 'PRESENT' ? '출석' : status === 'LATE' ? '지각' : '결석'}</button>
                                    );
                                  })}
                                </div>
                              )}
                              {activeTab === 'LEARNING' && (
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  <select className="text-[10px] font-black text-slate-600 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200 outline-none max-w-[100px] truncate" value={currentSelectedWbId} onChange={(e) => setSelectedWorkbooks({...selectedWorkbooks, [student.id]: e.target.value})}>
                                    <option value="">교재</option>
                                    {allAvailableWbs.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                                  </select>
                                  <input type="number" placeholder="P" className="w-14 px-2 py-2 rounded-xl border border-slate-200 text-xs outline-none font-black text-right" onKeyDown={(e) => { if(e.key === 'Enter') { handleUpdateProgress(student.id, currentSelectedWbId, e.currentTarget.value); e.currentTarget.value = ''; } }} />
                                </div>
                              )}
                              {activeTab === 'CONSULTATION' && (
                                <div className="flex-1">
                                  <input type="text" placeholder="특이사항 입력" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold" onKeyDown={(e) => { if(e.key === 'Enter' && e.currentTarget.value) { const newCons: ConsultationRecord = { id: 'c'+Date.now()+Math.random(), studentId: student.id, teacherId: user?.id || '', note: e.currentTarget.value, date: today }; updateState(prev => ({ ...prev, consultations: [...(prev.consultations || []), newCons] })); e.currentTarget.value = ''; alert(`${student.name} 기록 완료`); } }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* 오늘 보강 현황판 */}
          <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-100 shadow-sm">
            <h3 className="text-xs font-black mb-6 text-indigo-600 uppercase tracking-widest flex items-center justify-between">
              오늘의 보강 명단
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-[9px]">{makeupsToday.length}명</span>
            </h3>
            <div className="space-y-3">
              {makeupsToday.map(m => {
                const s = state.students.find(student => student.id === m.studentId);
                return (
                  <div key={m.id} className="bg-white p-4 rounded-2xl border border-indigo-200 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm font-black text-slate-800">{s?.name}</p>
                      <p className="text-[9px] text-indigo-400 font-black uppercase">{m.method === 'TEACHER' ? '담임' : m.method === 'CLINIC' ? '클리닉' : '원장'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {m.status === 'COMPLETED' ? '완료' : '대기'}
                    </span>
                  </div>
                );
              })}
              {makeupsToday.length === 0 && (
                <p className="text-[11px] text-slate-400 italic text-center py-4 font-bold">오늘 예정된 보강이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 최근 상담 브리핑 (New) */}
          <div className="bg-violet-50 p-8 rounded-[40px] border border-violet-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-xs font-black mb-6 text-violet-600 uppercase tracking-widest flex items-center justify-between">
              최근 AI 상담 브리핑
              <button onClick={() => navigate('/consultation')} className="text-[9px] bg-violet-600 text-white px-2 py-0.5 rounded-lg hover:bg-violet-700 transition-colors">전체보기</button>
            </h3>
            <div className="space-y-3">
              {recentBriefings.map(b => {
                const s = state.students.find(student => student.id === b.studentId);
                return (
                  <div key={b.id} className="bg-white p-4 rounded-2xl border border-violet-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/consultation')}>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm font-black text-slate-800">{s?.name}</p>
                      <span className="text-[9px] text-slate-400 font-bold">{b.date}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {b.content.replace(/#|1\.|2\.|3\./g, '').slice(0, 100)}...
                    </p>
                  </div>
                );
              })}
              {recentBriefings.length === 0 && (
                <p className="text-[11px] text-slate-400 italic text-center py-4 font-bold">생성된 AI 브리핑이 없습니다.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-50">
            <h3 className="text-xs font-black mb-8 text-slate-400 uppercase tracking-widest">학년 분포 현황</h3>
            <div className="h-56">
              {gradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#cbd5e1'}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f1f5f9', radius: 10}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={24}>
                      {gradeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 italic text-xs font-black">DATA NOT FOUND</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center text-xl shadow-lg`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
      <p className="text-xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

export default Dashboard;
