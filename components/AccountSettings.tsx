
import React, { useState } from 'react';
import { User, AppState } from '../types';

interface Props {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const AccountSettings: React.FC<Props> = ({ currentUser, setCurrentUser, updateState }) => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!currentUser) return null;

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (currentUser.password !== currentPw) {
      setError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPw !== confirmPw) {
      setError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (newPw.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    updateState(prev => {
      const updatedUsers = prev.users.map(u => 
        u.id === currentUser.id ? { ...u, password: newPw } : u
      );
      return { ...prev, users: updatedUsers };
    });

    setCurrentUser({ ...currentUser, password: newPw });

    setSuccess('비밀번호가 성공적으로 변경되었습니다.');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };

  // 프로필 타이틀 생성 로직 (원장님 원장님 방지)
  const name = currentUser.name || '';
  const roleTitle = currentUser.role === 'DIRECTOR' ? '원장님' : '선생님';
  const profileTitle = name.includes(roleTitle) ? name : `${name} ${roleTitle}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">내 정보 관리</h2>
        <p className="text-slate-500">계정의 보안 설정을 관리합니다.</p>
      </header>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-slate-50">
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-100">
            {name[0] || 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{profileTitle}</h3>
            <p className="text-slate-400">아이디: {currentUser.username}</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <h4 className="font-bold text-slate-700 flex items-center">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
            비밀번호 변경
          </h4>

          {error && <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100">{error}</div>}
          {success && <div className="p-4 bg-emerald-50 text-emerald-600 text-sm rounded-xl border border-emerald-100">{success}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">현재 비밀번호</label>
              <input 
                type="password" 
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="현재 사용 중인 비밀번호"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">새 비밀번호</label>
                <input 
                  type="password" 
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="변경할 비밀번호"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">새 비밀번호 확인</label>
                <input 
                  type="password" 
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="다시 한번 입력"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 transition-all shadow-lg active:scale-95"
          >
            비밀번호 변경하기
          </button>
        </form>
      </div>

      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">보안 팁</h5>
        <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4 leading-relaxed">
          <li>비밀번호는 주기적으로 변경하는 것이 안전합니다.</li>
          <li>다른 사람이 유추하기 쉬운 생일이나 전화번호는 피해주세요.</li>
          <li>비밀번호를 분실한 경우 원장님께 초기화를 요청하세요.</li>
        </ul>
      </div>
    </div>
  );
};

export default AccountSettings;
