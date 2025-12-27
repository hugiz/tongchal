import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { AppState, User } from './types';
import { INITIAL_STATE } from './constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import ClassManagement from './components/ClassManagement';
import LearningStatus from './components/LearningStatus';
import ConsultationLogs from './components/ConsultationLogs';
import WorkbookManagement from './components/WorkbookManagement';
import TeacherManagement from './components/TeacherManagement';
import DataManagement from './components/DataManagement';
import AccountSettings from './components/AccountSettings';
import MakeupManagement from './components/MakeupManagement';
import Login from './components/Login';

const App: React.FC = () => {
  // 1. 로컬 데이터 로드 (최우선)
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('edulog_state_v1');
    if (!saved) return INITIAL_STATE;
    try {
      return { ...INITIAL_STATE, ...JSON.parse(saved) };
    } catch (e) {
      return INITIAL_STATE;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('edulog_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'OFFLINE' | 'CONNECTING' | 'LIVE'>('OFFLINE');
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const isInitialFetch = useRef(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  // 클라우드 데이터 가져오기
  const refreshFromCloud = useCallback(async () => {
    if (!supabaseRef.current) return;
    try {
      setCloudStatus('CONNECTING');
      const { data, error } = await supabaseRef.current.from('app_sync').select('data').eq('id', 'global_state').single();
      if (!error && data?.data) {
        setState(data.data);
        setCloudStatus('LIVE');
      }
    } catch (err) {
      setCloudStatus('OFFLINE');
    }
  }, []);

  // 클라우드 연결 설정
  useEffect(() => {
    const url = localStorage.getItem('edulog_cloud_url');
    const key = localStorage.getItem('edulog_cloud_key');

    if (url && key) {
      const client = createClient(url, key);
      supabaseRef.current = client;
      
      refreshFromCloud().then(() => {
        isInitialFetch.current = false;
        client.channel('global-changes')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_sync', filter: 'id=eq.global_state' }, (payload) => {
            if (payload.new?.data) {
              setState(payload.new.data);
            }
          })
          .subscribe();
      });
    }
  }, [refreshFromCloud]);

  // 데이터 변경 시 로컬 저장 및 클라우드 푸시
  useEffect(() => {
    localStorage.setItem('edulog_state_v1', JSON.stringify(state));
    
    if (!isInitialFetch.current && cloudStatus === 'LIVE' && supabaseRef.current) {
      const timer = setTimeout(() => {
        supabaseRef.current!.from('app_sync').upsert({ id: 'global_state', data: state })
          .catch(err => console.error('Push Error:', err));
      }, 1000); // 잦은 푸시 방지용 딜레이
      return () => clearTimeout(timer);
    }
  }, [state, cloudStatus]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('edulog_user', JSON.stringify(user));
    navigate('/');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('edulog_user');
    setIsMenuOpen(false);
    navigate('/login');
  };

  // 상태 업데이트 헬퍼
  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => updater(prev));
  }, []);

  if (!currentUser && location.pathname !== '/login') {
    return <Login onLogin={handleLogin} users={state.users} />;
  }

  const isDirector = currentUser?.role === 'DIRECTOR';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {currentUser && (
        <button 
          onClick={() => setIsMenuOpen(true)}
          className={`md:hidden fixed top-4 left-4 z-[40] bg-white p-3 rounded-2xl shadow-xl border border-slate-100 transition-all ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      )}

      {currentUser && (
        <>
          {isMenuOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[50] md:hidden" onClick={() => setIsMenuOpen(false)} />
          )}

          <aside className={`fixed inset-y-0 left-0 z-[60] w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 md:static md:translate-x-0 md:h-screen md:w-60 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black">T</div>
                <h1 className="text-xl font-black tracking-tight">통찰Edulog</h1>
              </div>
              <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                <span className={`status-dot ${cloudStatus === 'LIVE' ? 'online' : 'offline'}`}></span>
                <span className="text-[10px] font-black uppercase text-white/50">{cloudStatus === 'LIVE' ? 'Cloud Connected' : 'Local Only'}</span>
              </div>
            </div>
            
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
              <SidebarItem to="/" icon="📊" label="대시보드" active={location.pathname === '/'} onClick={() => setIsMenuOpen(false)} />
              {isDirector && (
                <>
                  <SidebarItem to="/teachers" icon="👩‍🏫" label="교사 관리" active={location.pathname === '/teachers'} onClick={() => setIsMenuOpen(false)} />
                  <SidebarItem to="/sync" icon="🔄" label="동기화 설정" active={location.pathname === '/sync'} onClick={() => setIsMenuOpen(false)} />
                </>
              )}
              <SidebarItem to="/students" icon="👥" label="학생 관리" active={location.pathname === '/students'} onClick={() => setIsMenuOpen(false)} />
              <SidebarItem to="/workbooks" icon="📚" label="문제집 관리" active={location.pathname === '/workbooks'} onClick={() => setIsMenuOpen(false)} />
              <SidebarItem to="/classes" icon="🏫" label="출석 관리" active={location.pathname === '/classes'} onClick={() => setIsMenuOpen(false)} />
              <SidebarItem to="/makeup" icon="🩹" label="보강 관리" active={location.pathname === '/makeup'} onClick={() => setIsMenuOpen(false)} />
              <SidebarItem to="/learning" icon="✍️" label="학습 기록" active={location.pathname === '/learning'} onClick={() => setIsMenuOpen(false)} />
              <SidebarItem to="/consultation" icon="📋" label="상담 일지" active={location.pathname === '/consultation'} onClick={() => setIsMenuOpen(false)} />
              <SidebarItem to="/account" icon="⚙️" label="계정 설정" active={location.pathname === '/account'} onClick={() => setIsMenuOpen(false)} />
            </nav>

            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black">{currentUser.name[0]}</div>
                <div className="overflow-hidden">
                  <p className="text-sm font-black truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{isDirector ? 'Director' : 'Teacher'}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-2.5 bg-white/5 hover:bg-rose-500 rounded-xl text-xs font-black transition-all">로그아웃</button>
            </div>
          </aside>
        </>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full pt-20 md:pt-8">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} users={state.users} />} />
          <Route path="/" element={<Dashboard state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/teachers" element={<TeacherManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/students" element={<StudentManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/sync" element={<DataManagement state={state} updateState={setState} cloudStatus={cloudStatus} onRefresh={refreshFromCloud} />} />
          <Route path="/workbooks" element={<WorkbookManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/classes" element={<ClassManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/makeup" element={<MakeupManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/learning" element={<LearningStatus state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/consultation" element={<ConsultationLogs state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/account" element={<AccountSettings currentUser={currentUser} setCurrentUser={setCurrentUser} updateState={updateState} />} />
        </Routes>
      </main>
    </div>
  );
};

const SidebarItem = ({ to, icon, label, active, onClick }: { to: string, icon: string, label: string, active: boolean, onClick: () => void }) => (
  <Link to={to} onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg font-black' : 'text-white/60 hover:bg-white/5 hover:text-white font-bold'}`}>
    <span className="text-lg">{icon}</span>
    <span className="text-sm tracking-tight">{label}</span>
  </Link>
);

export default App;