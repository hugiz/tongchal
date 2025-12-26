
import React, { useState } from 'react';
import { AppState, User } from '../types';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  user: User | null;
}

const TeacherManagement: React.FC<Props> = ({ state, updateState, user }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">교사 관리</h2>
        {isDirector && (
          <div className="flex gap-2">
            <button onClick={handleCopyInviteLink} className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs">초대 링크</button>
            <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs">교사 등록</button>
          </div>
        )}
      </div>

      {isAdding && isDirector && (
        <form onSubmit={handleAddTeacher} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="선생님 이름" className="w-full p-3 border rounded-xl" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호" className="w-full p-3 border rounded-xl" />
          <button type="submit" className="w-full bg-slate-800 text-white p-3 rounded-xl font-bold">등록 완료</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.users.filter(u => u.role === 'TEACHER').map(teacher => (
          <div key={teacher.id} className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600">{teacher.name[0]}</div>
              <span className="font-bold">{teacher.name}</span>
            </div>
            {isDirector && (
              <button onClick={() => updateState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== teacher.id) }))} className="text-rose-400 font-bold">삭제</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherManagement;
