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
  const navigate = useNavigate();
  const [activeActionClass, setActiveActionClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'LEARNING' | 'CONSULTATION'>('ATTENDANCE');

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dayName = DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1];

  const isDirector = user?.role === 'DIRECTOR';

  // 핵심 지표 계산 (안전한 계산 및 실시간 반영)
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
    const presentCount = attendance.filter(a => 
      a.date === today && 
      (a.status === 'PRESENT' || a.status === 'LATE') && 
      visibleStudentIds.includes(a.studentId)
    ).length;

    return {
      studentTotal: visibleStudents.length,
      classTotal: visibleClasses.length,
      attendanceDisplay: expectedCount > 0 ? `${presentCount} / ${expectedCount}` : "0 / 0",
      makeupTotal: makeups.filter(m => m.makeupDate === today && visibleStudentIds.includes(m.studentId)).length,
      briefingTotal: briefings.filter(b => visibleStudentIds.includes(b.studentId)).length,
      observationTotal: consultations.filter(c => visibleStudentIds.includes(c.studentId)).length,
      visibleClasses,
      visibleStudents,
      attendance
    };
  }, [state, isDirector, user, today, dayName]);

  const handleAttendance = (studentId: string, classId: string, status: AttendanceStatus) => {
    updateState(prev => {
      const currentAttendance = [...(prev.attendance || [])];
      const existingIdx = currentAttendance.findIndex(a => a.studentId === studentId && a.date === today);
      
      if (existingIdx > -1) {
        currentAttendance[existingIdx] = { ...currentAttendance[existingIdx], status };
      } else {
        currentAttendance.push({ 
          id: `at_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
          studentId, 
          classId, 
          date: today, 
          status 
        });
      }
      return { ...prev, attendance: currentAttendance };
    });
  };

  const handleUpdateProgress = (studentId: string, pageStr: string) => {
    const page = parseInt(pageStr);
    if (isNaN(page)) return;

    const student = state.students.find(s => s.id === studentId);
    const workbookId = student?.workbooks[0] || state.workbooks[0]?.id || '';
    if (!workbookId) return;
    
    const newProgress: ProgressRecord = { 
      id: `p_${Date.now()}`, 
      studentId, 
      workbookId, 
      currentPage: page, 
      date: today 
    };
    
    updateState(prev => ({ ...prev, progress: [...(prev.progress || []), newProgress] }));
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">안녕하세요, {user?.name} 👋</h2>
          <p className="text-slate-500 font-medium">오늘의 학원 운영 현황입니다.</p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
          <span className="text-sm font-black text-slate-700">{today} ({dayName})</span>
        </div>
      </header>

      {/* 실시간 대시보드 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard title="원생" value={stats.studentTotal} icon="👥" color="bg-indigo-600" />
        <StatCard title="학급" value={stats.classTotal} icon="🏫" color="bg-emerald-600" />
        <StatCard title="출석" value={stats.attendanceDisplay} icon="✅" color="bg-amber-500" />
        <StatCard title="보강" value={stats.makeupTotal} icon="🩹" color="bg-rose-500" />
        <StatCard title="브리핑" value={stats.briefingTotal} icon="✨" color="bg-violet-600" />
        <StatCard title="관찰" value={stats.observationTotal} icon="📝" color="bg-slate-700" />
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          학급별 빠른 관리
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.visibleClasses.map(cls => {
            const isSelected = activeActionClass === cls.id;
            const isClassToday = (cls.attendanceDays || []).includes(dayName);
            const classStudents = stats.visibleStudents.filter(s => s.classId === cls.id);

            return (
              <div key={cls.id} className={`bg-white rounded-[32px] border transition-all duration-300 ${isSelected ? 'border-indigo-500 shadow-2xl ring-4 ring-indigo-50' : 'border-slate-100 hover:shadow-lg'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${isClassToday ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                      {cls.name[0]}
                    </div>
                    {isClassToday && <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-1 rounded-lg">오늘수업</span>}
                  </div>
                  <h4 className="font-black text-slate-800 text-lg mb-6 truncate">{cls.name}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'ATTENDANCE' ? null : cls.id); setActiveTab('ATTENDANCE'); }} className={`py-3 rounded-xl text-[10px] font-black transition-all ${isSelected && activeTab === 'ATTENDANCE' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>출석</button>
                    <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'LEARNING' ? null : cls.id); setActiveTab('LEARNING'); }} className={`py-3 rounded-xl text-[10px] font-black transition-all ${isSelected && activeTab === 'LEARNING' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>진도</button>
                    <button onClick={() => { setActiveActionClass(isSelected && activeTab === 'CONSULTATION' ? null : cls.id); setActiveTab('CONSULTATION'); }} className={`py-3 rounded-xl text-[10px] font-black transition-all ${isSelected && activeTab === 'CONSULTATION' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>상담</button>
                  </div>
                </div>

                {isSelected && (
                  <div className="border-t border-slate-50 p-5 bg-slate-50/50 space-y-2 animate-in slide-in-from-top duration-300 rounded-b-[32px]">
                    {classStudents.map(student => (
                      <div key={student.id} className="bg-white p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <span className="text-xs font-black text-slate-800">{student.name}</span>
                        <div className="flex gap-1">
                          {activeTab === 'ATTENDANCE' && ['PRESENT', 'LATE', 'ABSENT'].map(status => {
                            const att = stats.attendance.find(a => a.studentId === student.id && a.date === today);
                            return (
                              <button key={status} onClick={() => handleAttendance(student.id, cls.id, status as AttendanceStatus)} className={`px-2 py-1.5 rounded-lg text-[9px] font-black transition-all ${att?.status === status ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                {status === 'PRESENT' ? '출석' : status === 'LATE' ? '지각' : '결석'}
                              </button>
                            );
                          })}
                          {activeTab === 'LEARNING' && (
                             <input type="number" placeholder="P" className="w-12 px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black text-right outline-none focus:ring-2 focus:ring-emerald-500" onKeyDown={(e) => { if(e.key === 'Enter') { handleUpdateProgress(student.id, e.currentTarget.value); e.currentTarget.value = ''; alert('기록됨'); } }} />
                          )}
                          {activeTab === 'CONSULTATION' && (
                             <button onClick={() => navigate('/consultation')} className="text-[9px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-500 hover:text-white transition-all">작성</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <footer className="pt-12 text-center opacity-30">
        <p className="text-[10px] font-black tracking-widest text-slate-400">EDU-LOG SYSTEM LIVE • V1.5.0</p>
      </footer>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
  <div className="bg-white p-4 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-3 transition-all hover:scale-[1.02]">
    <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center text-lg shadow-lg`}>{icon}</div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-sm font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

export default Dashboard;