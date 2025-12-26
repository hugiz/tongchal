
import React, { useState } from 'react';
import { AppState, User, Student, AttendanceStatus, ProgressRecord, ConsultationRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ state, updateState, user }) => {
  const [activeActionClass, setActiveActionClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'LEARNING' | 'CONSULTATION'>('ATTENDANCE');

  const isDirector = user?.role === 'DIRECTOR';
  const today = new Date().toISOString().split('T')[0];
  
  const visibleClasses = isDirector 
    ? state.classes 
    : state.classes.filter(c => c.teacherId === user?.id);
  
  const visibleClassIds = visibleClasses.map(c => c.id);
  const visibleStudents = state.students.filter(s => visibleClassIds.includes(s.classId));
  const visibleStudentIds = visibleStudents.map(s => s.id);

  const gradeData = visibleStudents.reduce((acc: any[], s) => {
    const existing = acc.find(item => item.name === s.grade);
    if (existing) { existing.value += 1; } 
    else { acc.push({ name: s.grade, value: 1 }); }
    return acc;
  }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

  // Quick Action Handlers
  const handleAttendance = (studentId: string, classId: string, status: AttendanceStatus) => {
    updateState(prev => {
      const existingIdx = prev.attendance.findIndex(a => a.studentId === studentId && a.date === today);
      const newAttendance = [...prev.attendance];
      if (existingIdx > -1) {
        newAttendance[existingIdx] = { ...newAttendance[existingIdx], status };
      } else {
        newAttendance.push({ id: 'at' + Date.now() + Math.random(), studentId, classId, date: today, status });
      }
      return { ...prev, attendance: newAttendance };
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">안녕하세요, {user?.name}님 👋</h2>
          <p className="text-slate-500">{isDirector ? '학원 전체의 오늘을 관리합니다.' : '오늘 담당하시는 수업 현황입니다.'}</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 px-2 uppercase">Today</span>
          <span className="text-sm font-bold text-indigo-600 px-2">{today}</span>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={isDirector ? "전체 학생 수" : "담당 학생 수"} value={visibleStudents.length} icon="👥" color="bg-indigo-500" />
        <StatCard title="오늘의 반" value={visibleClasses.length} icon="🏫" color="bg-emerald-500" />
        <StatCard title="출석 완료" value={state.attendance.filter(a => a.date === today && a.status === 'PRESENT' && visibleStudentIds.includes(a.studentId)).length} icon="✅" color="bg-amber-500" />
        <StatCard title="상담 대기" value={visibleStudents.length - state.consultations.filter(c => c.date === today && visibleStudentIds.includes(c.studentId)).length} icon="📝" color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Class List & Quick Actions */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            수업 및 빠른 기록
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleClasses.map(cls => {
              const classStudents = state.students.filter(s => s.classId === cls.id);
              const presentCount = state.attendance.filter(a => a.classId === cls.id && a.date === today && a.status === 'PRESENT').length;
              const isSelected = activeActionClass === cls.id;

              return (
                <div key={cls.id} className={`bg-white rounded-3xl border transition-all ${isSelected ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-50' : 'border-slate-100 hover:shadow-md'}`}>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">🏫</div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                          {presentCount}/{classStudents.length} 등원
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg mb-1">{cls.name}</h4>
                    <p className="text-xs text-slate-400 mb-6 font-medium">담당: {state.users.find(u => u.id === cls.teacherId)?.name} 선생님</p>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => { setActiveActionClass(isSelected && activeTab === 'ATTENDANCE' ? null : cls.id); setActiveTab('ATTENDANCE'); }}
                        className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${isSelected && activeTab === 'ATTENDANCE' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        출석체크
                      </button>
                      <button 
                        onClick={() => { setActiveActionClass(isSelected && activeTab === 'LEARNING' ? null : cls.id); setActiveTab('LEARNING'); }}
                        className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${isSelected && activeTab === 'LEARNING' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        학습기록
                      </button>
                      <button 
                        onClick={() => { setActiveActionClass(isSelected && activeTab === 'CONSULTATION' ? null : cls.id); setActiveTab('CONSULTATION'); }}
                        className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${isSelected && activeTab === 'CONSULTATION' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        상담기록
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Panel */}
                  {isSelected && (
                    <div className="border-t border-slate-50 p-5 bg-slate-50/30 animate-in slide-in-from-top duration-300">
                      <div className="space-y-3">
                        {classStudents.map(student => (
                          <div key={student.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                            <span className="text-sm font-bold text-slate-700">{student.name}</span>
                            
                            {activeTab === 'ATTENDANCE' && (
                              <div className="flex gap-1">
                                {['PRESENT', 'LATE', 'ABSENT'].map(status => {
                                  const att = state.attendance.find(a => a.studentId === student.id && a.date === today);
                                  const label = status === 'PRESENT' ? '출석' : status === 'LATE' ? '지각' : '결석';
                                  const activeColor = status === 'PRESENT' ? 'bg-emerald-500' : status === 'LATE' ? 'bg-amber-500' : 'bg-rose-500';
                                  return (
                                    <button 
                                      key={status}
                                      onClick={() => handleAttendance(student.id, cls.id, status as AttendanceStatus)}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${att?.status === status ? `${activeColor} text-white shadow-md scale-105` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {activeTab === 'LEARNING' && (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  placeholder="p"
                                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                                  onBlur={(e) => {
                                    if(!e.target.value) return;
                                    const firstWb = student.workbooks[0];
                                    if(!firstWb) return;
                                    const newProgress: ProgressRecord = { id: 'p'+Date.now()+Math.random(), studentId: student.id, workbookId: firstWb, currentPage: parseInt(e.target.value), date: today };
                                    updateState(prev => ({ ...prev, progress: [...prev.progress, newProgress] }));
                                    e.target.value = '';
                                  }}
                                />
                                <span className="text-[10px] font-bold text-slate-300">P.기록</span>
                              </div>
                            )}

                            {activeTab === 'CONSULTATION' && (
                              <div className="flex-1 ml-4">
                                <input 
                                  type="text" 
                                  placeholder="관찰 메모 입력 후 Enter"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                                  onKeyDown={(e) => {
                                    if(e.key === 'Enter' && e.currentTarget.value) {
                                      const newCons: ConsultationRecord = { id: 'c'+Date.now()+Math.random(), studentId: student.id, teacherId: user?.id || '', note: e.currentTarget.value, date: today };
                                      updateState(prev => ({ ...prev, consultations: [...prev.consultations, newCons] }));
                                      e.currentTarget.value = '';
                                      alert(`${student.name} 상담 기록 완료`);
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grade Chart & Recent List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold mb-6 text-slate-800 uppercase tracking-widest">학년별 분포</h3>
            <div className="h-48">
              {gradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={20}>
                      {gradeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                   <span className="text-2xl">📊</span>
                   <p className="text-[10px] font-bold">데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold mb-4 text-slate-800 uppercase tracking-widest">실시간 상담 로그</h3>
            <div className="space-y-4">
              {state.consultations.filter(c => visibleStudentIds.includes(c.studentId)).slice(-3).reverse().map((c) => {
                const student = state.students.find(s => s.id === c.studentId);
                return (
                  <div key={c.id} className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-indigo-600">
                      {student?.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-bold text-slate-700 truncate">{student?.name}</h4>
                        <span className="text-[9px] font-bold text-slate-300">{c.date}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{c.note}</p>
                    </div>
                  </div>
                );
              })}
              {state.consultations.length === 0 && (
                <p className="text-center text-[10px] text-slate-400 py-10 font-bold">최근 상담 내역이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-lg transition-all">
    <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center text-2xl shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

export default Dashboard;
