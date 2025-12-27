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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isDirector = user?.role === 'DIRECTOR';

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector) return;
    
    if (!name || !username || !password) {
      alert('이름, 아이디, 비밀번호를 모두 입력해 주세요.');
      return;
    }

    const isExist = state.users.some(u => u.username === username);
    if (isExist) {
      alert('이미 등록된 아이디입니다.');
      return;
    }

    const newTeacher: User = {
      id: 't' + Date.now(),
      username: username.trim(),
      password: password.trim(),
      name: name.trim(),
      role: 'TEACHER'
    };

    updateState(prev => ({ 
      ...prev, 
      users: [...prev.users, newTeacher] 
    }));

    setName('');
    setUsername('');
    setPassword('');
    setIsAdding(false);
    alert(`${name} 선생님 계정이 생성되었습니다.`);
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

  const handleDeleteTeacher = (teacherId: string, teacherName: string) => {
    if (confirm(`${teacherName} 선생님을 삭제하시겠습니까?`)) {
      updateState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== teacherId)
      }));
    }
  };

  // 담당 학생 수 집계 로직 강화
  const getTeacherStats = (teacherId: string) => {
    // 1. 해당 선생님이 맡은 모든 반을 찾습니다.
    const teacherClasses = state.classes.filter(c => c.teacherId === teacherId);
    const classIds = teacherClasses.map(c => c.id);
    
    // 2. 그 반들에 소속된 학생들을 중복 없이 집계합니다.
    const teacherStudents = state.students.filter(s => classIds.includes(s.classId));
    
    return {
      classCount: teacherClasses.length,
      studentCount: teacherStudents.length,
      classNames: teacherClasses.map(c => c.name)
    };
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">선생님 및 계정 관리</h2>
          <p className="text-slate-500 text-sm font-medium">선생님별 담당 학생 수와 접속 정보를 관리합니다.</p>
        </div>
        {isDirector && (
          <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
            {isAdding ? '닫기' : '✨ 선생님 신규 등록'}
          </button>
        )}
      </div>

      {isAdding && isDirector && (
        <form onSubmit={handleAddTeacher} className="bg-white p-8 rounded-[32px] border border-indigo-100 shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">선생님 성함</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="실명 입력" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold focus:ring-4 focus:ring-indigo-500/10" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">접속 아이디 (ID)</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="아이디 지정" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold focus:ring-4 focus:ring-indigo-500/10" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">비밀번호 (PW)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 지정" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold focus:ring-4 focus:ring-indigo-500/10" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">선생님 계정 생성하기</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.users.filter(u => u.role === 'TEACHER' || u.role === 'DIRECTOR').map(teacher => {
          const isExpanded = activeTeacherId === teacher.id;
          const stats = getTeacherStats(teacher.id);
          const isMe = teacher.id === user?.id;
          
          return (
            <div 
              key={teacher.id} 
              className={`bg-white rounded-[32px] border transition-all cursor-pointer overflow-hidden ${isExpanded ? 'border-indigo-400 shadow-xl ring-4 ring-indigo-50' : 'border-slate-100 hover:shadow-md hover:border-slate-200'}`}
              onClick={() => setActiveTeacherId(isExpanded ? null : teacher.id)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                      {teacher.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-base block ${isExpanded ? 'text-indigo-600' : 'text-slate-800'}`}>
                          {teacher.name} {teacher.role === 'DIRECTOR' ? '원장님' : '선생님'}
                        </span>
                        {isMe && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">나</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {teacher.username}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">담당 학생</p>
                    <p className="text-xl font-black text-indigo-600">{stats.studentCount}명</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-50 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">담당 학급 ({stats.classCount}개)</p>
                      <div className="flex flex-wrap gap-1">
                        {stats.classNames.map((cn, i) => (
                          <span key={i} className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold text-slate-500">🏫 {cn}</span>
                        ))}
                        {stats.classCount === 0 && <span className="text-[9px] text-slate-300 italic">배정된 반 없음</span>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isDirector && teacher.id !== user?.id && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleResetPassword(teacher.id, teacher.name); }}
                            className="flex-1 bg-amber-50 text-amber-600 py-3 rounded-2xl text-[11px] font-black border border-amber-100 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                          >
                            비번 초기화 (1234)
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(teacher.id, teacher.name); }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
      </div>
    </div>
  );
};

export default TeacherManagement;