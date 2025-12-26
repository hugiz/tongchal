
import React, { useState } from 'react';
import { AppState, User, Student, AttendanceStatus, ProgressRecord, ConsultationRecord } from '../types';
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

  const missingStudents = expectedStudents.filter(s => !(state.attendance || []).some(a => a.studentId === s.id && a.date === today));

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

  // 인사말 호칭 로직 수정
  const greetingName = isDirector 
    ? "원장님" 
    : `${user?.name || '선생'}${user?.name?.endsWith('님') || user?.name?.endsWith('선생님') ? '' : ' 선생님'}`;

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">안녕하세요, {greetingName} 👋</h2>
          <p className="text-slate-500 font-medium mt-1">{isDirector ? "통찰수학학원의 전체 현황을 브리핑합니다." : "담당하고 계신 반의 오늘의 현황입니다."}</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r pr-3 border-slate-100">Today</span>
          <span className="text-sm font-black text-indigo-600 pl-1">{today}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={isDirector ? "전체 원생" : "담당 원생"} value={visibleStudents.length} icon="👥" color="bg-indigo-600" />
        <StatCard title="담당 학급" value={visibleClasses.length} icon="🏫" color="bg-emerald-600" />
        
        <div className="group relative">
          <StatCard 
            title="오늘 등원" 
            value={`${presentCount} / ${expectedCount}`} 
            icon="✅" 
            color="bg-amber-500" 
          />
          {missingStudents.length > 0 && (
            <div className="absolute top-full left-0 mt-3 w-full z-30 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <span className="w-1 h-3 bg-amber-500 rounded-full"></span> 미등원 명단
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missingStudents.map(s => (
                    <span key={s.id} className="bg-white/10 px-2.5 py-1 rounded-xl text-xs font-bold border border-white/5">{s.name}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <StatCard title="상담 및 특이사항" value={(state.consultations || []).filter(c => c.date === today && visibleStudentIds.includes(c.studentId)).length} icon="📝" color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
              <span className="w-2.5 h-8 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"></span>
              학급별 업무 관리
            </h3>
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-indigo-100"></span> 오늘 수업이 있는 반 강조됨
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleClasses.map(cls => {
              const classStudents = visibleStudents.filter(s => s.classId === cls.id);
              const presentCountClass = (state.attendance || []).filter(a => a.classId === cls.id && a.date === today && (a.status === 'PRESENT' || a.status === 'LATE')).length;
              const expectedCountClass = classStudents.filter(s => (s.attendanceDays || []).includes(dayName)).length;
              const isSelected = activeActionClass === cls.id;
              
              // 오늘 수업 여부 확인
              const isClassToday = (cls.attendanceDays || []).includes(dayName);

              return (
                <div key={cls.id} className={`bg-white rounded-[32px] border transition-all overflow-hidden relative group/card ${isSelected ? 'border-indigo-500 shadow-2xl ring-8 ring-indigo-50' : isClassToday ? 'border-indigo-100 bg-indigo-50/40 shadow-sm' : 'border-slate-100 hover:shadow-xl hover:-translate-y-1'}`}>
                  {isClassToday && !isSelected && (
                    <div className="absolute top-4 right-5 z-10">
                       <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg shadow-indigo-200 animate-pulse">✨ 오늘 수업</span>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl font-black transition-all ${isClassToday ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-50 text-indigo-400 shadow-slate-100'}`}>{cls.name[0]}</div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-wider ${isClassToday ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          {presentCountClass}/{expectedCountClass} 등원
                        </span>
                      </div>
                    </div>
                    <h4 className="font-black text-slate-800 text-xl mb-1">{cls.name}</h4>
                    <p className="text-xs text-slate-400 mb-8 font-bold flex items-center gap-1.5">
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       담당: {state.users.find(u => u.id === cls.teacherId)?.name} 선생님
                    </p>
                    <div className="grid grid-cols-3 gap-2.5 relative z-10">
                      <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'ATTENDANCE' ? null : cls.id); setActiveTab('ATTENDANCE'); }} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${isSelected && activeTab === 'ATTENDANCE' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}>출석</button>
                      <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'LEARNING' ? null : cls.id); setActiveTab('LEARNING'); }} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${isSelected && activeTab === 'LEARNING' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}>학습</button>
                      <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'CONSULTATION' ? null : cls.id); setActiveTab('CONSULTATION'); }} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${isSelected && activeTab === 'CONSULTATION' ? 'bg-rose-600 text-white shadow-xl shadow-rose-200 scale-105' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}>상담</button>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="border-t border-slate-50 p-6 bg-slate-50/50 animate-in slide-in-from-top duration-500">
                      <div className="space-y-3.5">
                        {classStudents.map(student => {
                          const studentClass = state.classes.find(c => c.id === student.classId);
                          const classWorkbooks = state.workbooks.filter(w => (studentClass?.workbooks || []).includes(w.id));
                          const individualWorkbooks = state.workbooks.filter(w => (student.workbooks || []).includes(w.id));
                          const allAvailableWbs = [...classWorkbooks, ...individualWorkbooks];
                          const currentSelectedWbId = selectedWorkbooks[student.id] || (allAvailableWbs[0]?.id || '');
                          const isExpected = (student.attendanceDays || []).includes(dayName);

                          return (
                            <div key={student.id} className={`bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm flex-wrap gap-3 ${!isExpected ? 'opacity-50 grayscale' : 'border-slate-100'}`}>
                              <div className="flex flex-col min-w-[70px]">
                                <span className="text-sm font-black text-slate-800">{student.name}</span>
                                {!isExpected && <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">비수업일</span>}
                              </div>
                              {activeTab === 'ATTENDANCE' && (
                                <div className="flex gap-1">
                                  {['PRESENT', 'LATE', 'ABSENT'].map(status => {
                                    const att = (state.attendance || []).find(a => a.studentId === student.id && a.date === today);
                                    const label = status === 'PRESENT' ? '출석' : status === 'LATE' ? '지각' : '결석';
                                    const activeColor = status === 'PRESENT' ? 'bg-emerald-500' : status === 'LATE' ? 'bg-amber-500' : 'bg-rose-500';
                                    return (
                                      <button key={status} onClick={() => handleAttendance(student.id, cls.id, status as AttendanceStatus)} className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ${att?.status === status ? `${activeColor} text-white shadow-lg scale-110` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{label}</button>
                                    );
                                  })}
                                </div>
                              )}
                              {activeTab === 'LEARNING' && (
                                <div className="flex items-center gap-2 flex-1 min-w-[200px] justify-end">
                                  <select className="text-[10px] font-black text-slate-600 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200 outline-none max-w-[130px] truncate" value={currentSelectedWbId} onChange={(e) => setSelectedWorkbooks({...selectedWorkbooks, [student.id]: e.target.value})}>
                                    <option value="">교재 선택</option>
                                    {classWorkbooks.length > 0 && <optgroup label="🏛️ 반 공통">{classWorkbooks.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}</optgroup>}
                                    {individualWorkbooks.length > 0 && <optgroup label="👤 개인 교재">{individualWorkbooks.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}</optgroup>}
                                  </select>
                                  <input type="number" placeholder="P" className="w-16 px-2.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-4 focus:ring-emerald-500/10 font-black text-right" onKeyDown={(e) => { if(e.key === 'Enter') { handleUpdateProgress(student.id, currentSelectedWbId, e.currentTarget.value); e.currentTarget.value = ''; } }} />
                                </div>
                              )}
                              {activeTab === 'CONSULTATION' && (
                                <div className="flex-1 ml-4">
                                  <input type="text" placeholder="관찰 소견 입력 후 Enter" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-[11px] outline-none focus:ring-4 focus:ring-rose-500/10 font-bold" onKeyDown={(e) => { if(e.key === 'Enter' && e.currentTarget.value) { const newCons: ConsultationRecord = { id: 'c'+Date.now()+Math.random(), studentId: student.id, teacherId: user?.id || '', note: e.currentTarget.value, date: today }; updateState(prev => ({ ...prev, consultations: [...(prev.consultations || []), newCons] })); e.currentTarget.value = ''; alert(`${student.name} 학생의 관찰 기록을 저장했습니다.`); } }} />
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
            {visibleClasses.length === 0 && (
              <div className="col-span-full py-24 bg-white rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-4">🏫</span>
                <p className="text-slate-400 font-black italic">담당하고 있는 학급이 아직 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50">
            <h3 className="text-xs font-black mb-8 text-slate-400 uppercase tracking-[0.2em]">{isDirector ? "전체 학년 분포" : "담당 학년 분포"}</h3>
            <div className="h-56">
              {gradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f1f5f9', radius: 10}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 800}} />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={28}>
                      {gradeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 italic">
                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">📉</div>
                   <p className="text-[11px] font-black uppercase">Data Not Found</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-indigo-900/20 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -translate-y-10 translate-x-10 blur-3xl"></div>
            <h3 className="text-xs font-black mb-6 text-indigo-400 uppercase tracking-[0.2em] relative z-10">최근 관찰 기록</h3>
            <div className="space-y-5 relative z-10">
              {(state.consultations || []).filter(c => visibleStudentIds.includes(c.studentId)).slice(-4).reverse().map((c) => {
                const student = state.students.find(s => s.id === c.studentId);
                return (
                  <div key={c.id} className="flex items-start space-x-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/40 shrink-0">{student?.name?.[0] || 'S'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <h4 className="text-sm font-black text-indigo-100 truncate">{student?.name}</h4>
                        <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">{c.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-medium">{c.note}</p>
                    </div>
                  </div>
                );
              })}
              {(state.consultations || []).filter(c => visibleStudentIds.includes(c.studentId)).length === 0 && (
                <div className="text-center py-12">
                   <p className="text-[11px] text-slate-500 font-black uppercase italic tracking-widest">No Recent Logs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
  <div className="bg-white p-7 rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-50 flex items-center space-x-5 hover:scale-[1.02] transition-all cursor-default group">
    <div className={`w-16 h-16 rounded-[24px] ${color} text-white flex items-center justify-center text-2xl shadow-xl transition-transform group-hover:rotate-6`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

export default Dashboard;
