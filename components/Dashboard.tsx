
import React from 'react';
import { AppState, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  state: AppState;
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ state, user }) => {
  const isDirector = user?.role === 'DIRECTOR';
  
  const teacherClasses = isDirector 
    ? state.classes 
    : state.classes.filter(c => c.teacherId === user?.id);
  
  const classIds = teacherClasses.map(c => c.id);
  const teacherStudents = state.students.filter(s => classIds.includes(s.classId));
  const studentIds = teacherStudents.map(s => s.id);

  // Filter consultations based on access
  const visibleConsultations = isDirector 
    ? state.consultations 
    : state.consultations.filter(c => studentIds.includes(c.studentId));

  // Chart data: Students per grade (only for visible students)
  const gradeData = teacherStudents.reduce((acc: any[], s) => {
    const existing = acc.find(item => item.name === s.grade);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: s.grade, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">안녕하세요, {user?.name}님 👋</h2>
        <p className="text-slate-500">
          {isDirector ? '학원 전체 현황입니다.' : '담당하고 계신 반의 현황입니다.'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={isDirector ? "전체 학생 수" : "내 담당 학생"} value={teacherStudents.length} icon="👥" color="bg-blue-500" />
        <StatCard title="운영 중인 반" value={teacherClasses.length} icon="🏫" color="bg-purple-500" />
        <StatCard title="누적 상담 수" value={visibleConsultations.length} icon="📝" color="bg-rose-500" />
        <StatCard title="전체 교재 수" value={state.workbooks.length} icon="📚" color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800">학년별 학생 분포</h3>
          <div className="h-64">
            {gradeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {gradeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">데이터가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4 text-slate-800">최근 상담 내역</h3>
          <div className="space-y-4">
            {visibleConsultations.slice(-4).reverse().map((c) => {
              const student = state.students.find(s => s.id === c.studentId);
              return (
                <div key={c.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                    {student?.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-semibold text-slate-700">{student?.name} 학생</h4>
                      <span className="text-xs text-slate-400">{c.date}</span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{c.note}</p>
                  </div>
                </div>
              );
            })}
            {visibleConsultations.length === 0 && (
              <p className="text-center text-slate-400 py-12">최근 상담 기록이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-xl ${color} text-white flex items-center justify-center text-2xl shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default Dashboard;
