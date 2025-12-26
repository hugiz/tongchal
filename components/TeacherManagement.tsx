
import React, { useState } from 'react';
import { AppState, User } from '../types';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const TeacherManagement: React.FC<Props> = ({ state, updateState, user }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const isDirector = user?.role === 'DIRECTOR';

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector) return;
    if (!name || !password) return;

    const newTeacher: User = {
      id: 't' + Date.now(),
      username: name,
      password: password,
      name: name,
      role: 'TEACHER'
    };

    updateState(prev => ({ ...prev, users: [...prev.users, newTeacher] }));
    setName('');
    setPassword('');
    setIsAdding(false);
  };

  const handleResetPassword = (teacherId: string, teacherName: string) => {
    if (confirm(`${teacherName} 선생님의 비밀번호를 "1234"로 초기화하시겠습니까?`)) {
      updateState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === teacherId ? { ...u, password: '1234' } : u)
      }));
      alert('비밀번호가 1234로 초기화되었습니다.');
    }
  };

  const handleCopyInviteLink = () => {
    const url = localStorage.getItem('edulog_cloud_url');
    const key = localStorage.getItem('edulog_cloud_key');
    if (!url || !key) {
      alert('먼저 [데이터 동기화] 메뉴에서 클라우드 설정을 완료해 주세요.');
      return;
    }
    const baseUrl = window.location.origin + window.location.pathname;
    const inviteLink = `${baseUrl}?c_url=${encodeURIComponent(url)}&c_key=${encodeURIComponent(key)}`;
    navigator.clipboard.writeText(inviteLink);
    alert('초대 링크가 복사되었습니다!');
  };

  const getStudentCount = (teacherId: string) => {
    const teacherClasses = state.classes.filter(c => c.teacherId === teacherId);
    const teacherClassIds = teacherClasses.map(c => c.id);
    return state.students.filter(s => teacherClassIds.includes(s.classId)).length;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">교사 관리</h2>
          <p className="text-slate-500 text-sm font-medium">선생님들의 계정 권한 및 담당 현황을 관리합니다.</p>
        </div>
        {isDirector && (
          <div className="flex gap-2">
            <button onClick={handleCopyInviteLink} className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-2xl font-black text-xs border border-emerald-100 shadow-sm hover:bg-emerald-100 transition-all">🔗 초대 링크 복사</button>
            <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-700 transition-all active:scale-95">✨ 교사 신규 등록</button>
          </div>
        )}
      </div>

      {isAdding && isDirector && (
        <form onSubmit={handleAddTeacher} className="bg-white p-8 rounded-[32px] border border-indigo-100 shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">선생님 이름 (ID로 사용됨)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름 입력" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">초기 비밀번호</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 설정" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">교사 등록 완료</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.users.filter(u => u.role === 'TEACHER').map(teacher => {
          const isExpanded = activeTeacherId === teacher.id;
          const studentCount = getStudentCount(teacher.id);
          
          return (
            <div 
              key={teacher.id} 
              className={`bg-white rounded-[32px] border transition-all cursor-pointer overflow-hidden ${isExpanded ? 'border-indigo-400 shadow-xl ring-4 ring-indigo-50' : 'border-slate-100 hover:shadow-md hover:border-slate-200'}`}
              onClick={() => setActiveTeacherId(isExpanded ? null : teacher.id)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                      {teacher.name[0]}
                    </div>
                    <div>
                      <span className="font-black text-slate-800 text-base block">{teacher.name} 선생님</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {teacher.username}</span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-slate-50 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">담당 현황</p>
                        <p className="text-sm font-black text-slate-800">총 {studentCount}명의 학생 지도 중</p>
                      </div>
                      <span className="text-2xl">👨‍🎓</span>
                    </div>

                    <div className="flex gap-2">
                      {isDirector && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleResetPassword(teacher.id, teacher.name); }}
                            className="flex-1 bg-amber-50 text-amber-600 py-3 rounded-2xl text-[11px] font-black border border-amber-100 hover:bg-amber-100 transition-all active:scale-95"
                          >
                            비번 초기화
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); if(confirm(`${teacher.name} 선생님을 삭제하시겠습니까?`)) updateState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== teacher.id) })); }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                            title="교사 삭제"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {state.users.filter(u => u.role === 'TEACHER').length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
            <p className="text-slate-300 font-black italic">등록된 선생님이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;
