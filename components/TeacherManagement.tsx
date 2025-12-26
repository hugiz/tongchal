
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
      alert('이미 동일한 성함의 선생님이 등록되어 있습니다.');
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
    setPassword(''); 
    setIsAdding(false);
  };

  const handleCopyInfo = (teacher: User) => {
    const text = `[EduLog 로그인 정보]\n성함: ${teacher.name}\n아이디: ${teacher.username}\n비밀번호: ${teacher.password}`;
    navigator.clipboard.writeText(text);
    alert('선생님 로그인 정보가 복사되었습니다. 카톡으로 전달해 주세요!');
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
    alert('선생님 초대용 자동 설정 링크가 복사되었습니다!\n이 링크를 선생님들께 카톡으로 보내주시면 설정 없이 즉시 이용 가능합니다.');
  };

  const teachers = state.users.filter(u => u.role === 'TEACHER');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">교사 관리</h2>
          <p className="text-slate-500">선생님들의 계정을 생성하고 관리합니다.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleCopyInviteLink}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-600 transition-all flex items-center space-x-2"
          >
            <span>✉️ 초대 링크 복사</span>
          </button>
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingTeacher(null);
              setName('');
              setPassword('');
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all"
          >
            {isAdding ? '닫기' : '새 선생님 등록'}
          </button>
        </div>
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">성함 (아이디로 사용됨)</label>
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
          <div key={teacher.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {teacher.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{teacher.name} 선생님</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">ID: {teacher.username}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => startEdit(teacher)}
                  className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleCopyInfo(teacher)}
                className="flex-1 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[10px] font-bold rounded-lg border border-slate-100 transition-all flex items-center justify-center gap-1"
              >
                <span>📋 계정정보 복사</span>
              </button>
              <button 
                onClick={() => {
                  if(confirm(`${teacher.name} 선생님을 삭제하시겠습니까?`)) {
                    updateState(prev => ({
                      ...prev,
                      users: prev.users.filter(u => u.id !== teacher.id)
                    }));
                  }
                }}
                className="px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg border border-slate-100 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
