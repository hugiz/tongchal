import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, User, AttendanceStatus, ProgressRecord } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface DashboardProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ state, updateState, user }) => {
  // Use the useNavigate hook to initialize the navigate function
  const navigate = useNavigate();
  const [activeActionClass, setActiveActionClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'LEARNING' | 'CONSULTATION'>('ATTENDANCE');

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dayName = DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1];

  const isDirector = user?.role === 'DIRECTOR';

  // 6가지 지표 계산 - useMemo를 사용하여 데이터가 바뀔 때만 재계산 및 즉각 반영
  const stats = useMemo(() => {
    const students = state.students || [];
    const classes = state.classes || [];
    const attendance = state.attendance || [];
    const makeups = state.makeups || [];
    const briefings = state.briefings || [];
    const consultations = state.consultations || [];

    const visibleClasses = isDirector 
      ? classes 
      : classes.filter(c => c.teacherId === user?.id);
    
    const visibleClassIds = visibleClasses.map(c => c.id);
    const visibleStudents = students.filter(s => visibleClassIds.includes(s.classId));
    const visibleStudentIds = visibleStudents.map(s => s.id);

    const expectedCount = visibleStudents.filter(s => (s.attendanceDays || []).includes(dayName)).length;
    const presentCount = attendance.filter(a => a.date === today && (a.status === 'PRESENT' || a.status === 'LATE') && visibleStudentIds.includes(a.studentId)).length;
    const makeupCount = makeups.filter(m => m.makeupDate === today && visibleStudentIds.includes(m.studentId)).length;
    const briefingCount = briefings.filter(b => visibleStudentIds.includes(b.studentId)).length;
    const observationCount = consultations.filter(c => visibleStudentIds.includes(c.studentId)).length;

    return {
      studentTotal: visibleStudents.length,
      classTotal: visibleClasses.length,
      attendanceRate: `${presentCount}/${expectedCount}`,
      makeupTotal: makeupCount,
      briefingTotal: briefingCount,
      observationTotal: observationCount,
      visibleClasses,
      visibleStudents,
      attendance,
      visibleStudentIds
    };
  }, [state, isDirector, user, today, dayName]);

  const handleAttendance = (studentId: string, classId: string, status: AttendanceStatus) => {
    updateState(prev => {
      const currentAttendance = prev.attendance || [];
      const existingIdx = currentAttendance.findIndex(a => a.studentId === studentId && a.date === today);
      const newAttendance = [...currentAttendance];
      if (existingIdx > -1) {
        newAttendance[existingIdx] = { ...newAttendance[existingIdx], status };
      } else {
        newAttendance.push({ id: 'at' + Date.now() + Math.random(), studentId, classId, date: today, status });
      }
      return { ...prev, attendance: newAttendance };
    });
  };

  const handleUpdateProgress = (studentId: string, pageStr: string) => {
    const page = parseInt(pageStr);
    const workbookId = (state.workbooks && state.workbooks[0]?.id) || '';
    if (!workbookId || isNaN(page) || page <= 0) return;
    
    const newProgress: ProgressRecord = { 
      id: 'p' + Date.now() + Math.random(), 
      studentId, 
      workbookId, 
      currentPage: page, 
      date: today 
    };
    updateState(prev => ({ ...prev, progress: [...(prev.progress || []), newProgress] }));
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">안녕하세요, {isDirector ? "원장님" : `${user?.name || '선생님'}`} 👋</h2>
          <p className="text-slate-500 font-medium mt-1">{isDirector ? "학원 전체 실시간 현황입니다." : "담당 반의 오늘 현황입니다."}</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <span className="text-sm font-black text-indigo-600">{today} ({dayName})</span>
        </div>
      </header>

      {/* 6가지 핵심 지표 카드 - 실시간 변화 반영 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="원생" value={stats.studentTotal} icon="👥" color="bg-indigo-600" />
        <StatCard title="학급" value={stats.classTotal} icon="🏫" color="bg-emerald-600" />
        <StatCard title="출석" value={stats.attendanceRate} icon="✅" color="bg-amber-500" />
        <StatCard title="보강" value={stats.makeupTotal} icon="🩹" color="bg-rose-500" />
        <StatCard title="브리핑" value={stats.briefingTotal} icon="✨" color="bg-violet-600" />
        <StatCard title="관찰" value={stats.observationTotal} icon="📝" color="bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 space-y-8">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
            <span className="w-2.5 h-8 bg-indigo-600 rounded-full"></span>
            학급별 실시간 업무
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.visibleClasses.map(cls => {
              const isSelected = activeActionClass === cls.id;
              const isClassToday = (cls.attendanceDays || []).includes(dayName);
              const classStudents = stats.visibleStudents.filter(s => s.classId === cls.id);

              return (
                <div key={cls.id} className={`bg-white rounded-[32px] border transition-all ${isSelected ? 'border-indigo-500 shadow-2xl ring-4 ring-indigo-50' : isClassToday ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 hover:shadow-xl'}`}>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${isClassToday ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-indigo-400'}`}>
                        {cls.name[0]}
                      </div>
                      {isClassToday && <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg animate-pulse">오늘 수업</span>}
                    </div>
                    <h4 className="font-black text-slate-800 text-lg mb-6">{cls.name}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'ATTENDANCE' ? null : cls.id); setActiveTab('ATTENDANCE'); }} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${isSelected && activeTab === 'ATTENDANCE' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>출석</button>
                      <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'LEARNING' ? null : cls.id); setActiveTab('LEARNING'); }} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${isSelected && activeTab === 'LEARNING' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'}`}>학습</button>
                      <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'CONSULTATION' ? null : cls.id); setActiveTab('CONSULTATION'); }} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${isSelected && activeTab === 'CONSULTATION' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-600'}`}>상담</button>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="border-t border-slate-50 p-6 bg-slate-50/50 space-y-3">
                      {classStudents.map(student => (
                        <div key={student.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <span className="text-sm font-black text-slate-800">{student.name}</span>
                          {activeTab === 'ATTENDANCE' && (
                            <div className="flex gap-1">
                              {['PRESENT', 'LATE', 'ABSENT'].map(status => {
                                const att = stats.attendance.find(a => a.studentId === student.id && a.date === today);
                                return (
                                  <button key={status} onClick={() => handleAttendance(student.id, cls.id, status as AttendanceStatus)} className={`px-2 py-1.5 rounded-xl text-[9px] font-black ${att?.status === status ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    {status === 'PRESENT' ? '출석' : status === 'LATE' ? '지각' : '결석'}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {activeTab === 'LEARNING' && (
                             <input type="number" placeholder="P" className="w-12 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-right outline-none" onKeyDown={(e) => { if(e.key === 'Enter') { handleUpdateProgress(student.id, e.currentTarget.value); e.currentTarget.value = ''; alert('저장됨'); } }} />
                          )}
                          {activeTab === 'CONSULTATION' && (
                             <button onClick={() => navigate('/consultation')} className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">일지 작성</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* 빌드 성공 확인용 푸터 */}
      <footer className="pt-10 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">EduLog System Ready • Last Update: 12.27 10:30</p>
      </footer>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
  <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex items-center space-x-3 transition-transform hover:scale-105 active:scale-95">
    <div className={`w-10 h-10 rounded-2xl ${color} text-white flex items-center justify-center text-lg shadow-lg`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-base font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

export default Dashboard;