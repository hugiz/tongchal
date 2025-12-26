
import React, { useState } from 'react';
import { AppState, User } from '../types';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const TeacherManagement: React.FC<Props> = ({ state, updateState }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) return;

    if (state.users.some(u => u.username === name)) {
      alert('이미 동일한 아이디(이름)의 선생님이 등록되어 있습니다.');
      return;
    }

    const newTeacher: User = {
      id: 't' + Date.now(),
      username: name,
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

  const handleUpdateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    updateState(prev => ({
      ...prev,
      users: prev.users.map(u => 
        u.id === editingTeacher.id 
          ? { ...u, name: name, password: password || u.password } 
          : u
      )
    }));

    setEditingTeacher(null);
    setName('');
    setPassword('');
    alert('정보가 수정되었습니다.');
  };

  const startEdit = (teacher: User) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setPassword(''); // 비밀번호는 보안상 빈 값으로 시작 (입력 시에만 변경)
    setIsAdding(false);
  };

  const handleDeleteTeacher = (id: string, teacherName: string) => {
    if (confirm(`${teacherName} 선생님의 계정을 삭제하시겠습니까?`)) {
      updateState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== id),
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
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingTeacher(null);
            setName('');
            setPassword('');
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition-all"
        >
          {isAdding ? '닫기' : '새 선생님 등록'}
        </button>
      </div>

      {(isAdding || editingTeacher) && (
        <form 
          onSubmit={editingTeacher ? handleUpdateTeacher : handleAddTeacher} 
          className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-in slide-in-from-top duration-300"
        >
          <h3 className="text-lg font-bold text-indigo-700 mb-4">
            {editingTeacher ? `${editingTeacher.name} 선생님 정보 수정` : '신규 교사 등록'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">성함</label>
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {editingTeacher ? '비밀번호 변경 (미입력 시 유지)' : '비밀번호 설정'}
              </label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                required={!editingTeacher}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg">
              {editingTeacher ? '수정 완료' : '교사 등록 완료'}
            </button>
            {editingTeacher && (
              <button 
                type="button" 
                onClick={() => setEditingTeacher(null)}
                className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl"
              >
                취소
              </button>
            )}
          </div>
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
                <p className="text-xs text-slate-400">ID: {teacher.username}</p>
              </div>
            </div>
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => startEdit(teacher)}
                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"
                title="수정"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                title="삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
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
