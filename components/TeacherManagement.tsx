
import React, { useState } from 'react';
import { AppState, User } from '../types';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const TeacherManagement: React.FC<Props> = ({ state, updateState }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) return;

    // Check if name already exists as a username
    if (state.users.some(u => u.username === name)) {
      alert('이미 동일한 이름의 선생님이 등록되어 있습니다.');
      return;
    }

    const newTeacher: User = {
      id: 't' + Date.now(),
      username: name, // ID is the name
      password: password,
      name: name,
      role: 'TEACHER'
    };

    updateState(prev => ({
      ...prev,
      users: [...prev.users, newTeacher]
    }));

    setName('');
    setPassword('');
    setIsAdding(false);
    alert(`${name} 선생님이 등록되었습니다.`);
  };

  const handleDeleteTeacher = (id: string, teacherName: string) => {
    if (confirm(`${teacherName} 선생님의 계정을 삭제하시겠습니까?`)) {
      updateState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== id),
        // Important: Update classes that this teacher was assigned to
        classes: prev.classes.map(c => 
          c.teacherId === id ? { ...c, teacherId: '' } : c
        )
      }));
    }
  };

  const teachers = state.users.filter(u => u.role === 'TEACHER');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">교사 관리</h2>
          <p className="text-slate-500">선생님들의 계정을 생성하고 관리합니다.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition-all"
        >
          {isAdding ? '닫기' : '새 선생님 등록'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddTeacher} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">선생님 성함 (아이디로 사용)</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="이름 입력"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">비밀번호 설정</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            교사 등록 완료
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map(teacher => (
          <div key={teacher.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                {teacher.name[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{teacher.name} 선생님</h4>
                <p className="text-xs text-slate-400">아이디: {teacher.username}</p>
              </div>
            </div>
            <button 
              onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
              className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        {teachers.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400">등록된 선생님이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;
