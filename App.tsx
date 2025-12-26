
import React, { useState, useEffect, useRef } from 'react';
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
import Login from './components/Login';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('edulog_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('edulog_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'OFFLINE' | 'CONNECTING' | 'LIVE'>('OFFLINE');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const isInitialFetch = useRef(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('c_url');
    const keyParam = params.get('c_key');

    if (urlParam && keyParam) {
      localStorage.setItem('edulog_cloud_url', decodeURIComponent(urlParam));
      localStorage.setItem('edulog_cloud_key', decodeURIComponent(keyParam));
      localStorage.removeItem('edulog_user');
      setCurrentUser(null);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    const url = localStorage.getItem('edulog_cloud_url');
    const key = localStorage.getItem('edulog_cloud_key');

    if (url && key) {
      const connectCloud = async () => {
        try {
          setCloudStatus('CONNECTING');
          const client = createClient(url, key);
          supabaseRef.current = client;

          const { data, error } = await client.from('app_sync').select('data').eq('id', 'global_state').single();
          
          if (error) {
            if (error.code === 'PGRST116' || error.message.includes('not found')) {
              await client.from('app_sync').upsert([{ id: 'global_state', data: state }]);
              setCloudStatus('LIVE');
            } else {
              setCloudError(`클라우드 접근 실패: ${error.message}`);
              setCloudStatus('OFFLINE');
            }
          } else if (data && data.data) {
            setState(data.data);
            setCloudStatus('LIVE');
          }
          
          isInitialFetch.current = false;

          client
            .channel('global-changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_sync', filter: 'id=eq.global_state' }, (payload) => {
              if (payload.new && payload.new.data) {
                setState(payload.new.data);
              }
            })
            .subscribe();

        } catch (err: any) {
          setCloudError(`설정 오류: ${err.message}`);
          setCloudStatus('OFFLINE');
        }
      };
      connectCloud();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('edulog_state', JSON.stringify(state));
    if (!isInitialFetch.current && cloudStatus === 'LIVE' && supabaseRef.current) {
      supabaseRef.current.from('app_sync').update({ data: state }).eq('id', 'global_state')
        .then(({ error }) => {
          if (error) console.error('Cloud push failed', error);
        });
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

  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(updater);
  };

  const setFullState = (newState: AppState) => {
    setState(newState);
  };

  if (!currentUser && location.pathname !== '/login') {
    return <Login onLogin={handleLogin} users={state.users} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {currentUser && (
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-indigo-700 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
          md:static md:translate-x-0 md:h-screen md:shadow-xl
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tight">EduLog</h1>
            <div className="mt-2"><CloudBadge status={cloudStatus} /></div>
          </div>
          
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            <SidebarItem to="/" icon="📊" label="대시보드" active={location.pathname === '/'} onClick={() => setIsMenuOpen(false)} />
            {currentUser.role === 'DIRECTOR' && (
              <>
                <SidebarItem to="/teachers" icon="👩‍🏫" label="교사 관리" active={location.pathname === '/teachers'} onClick={() => setIsMenuOpen(false)} />
                <SidebarItem to="/sync" icon="🔄" label="데이터 동기화" active={location.pathname === '/sync'} onClick={() => setIsMenuOpen(false)} />
              </>
            )}
            <SidebarItem to="/students" icon="👥" label="학생 관리" active={location.pathname === '/students'} onClick={() => setIsMenuOpen(false)} />
            <SidebarItem to="/workbooks" icon="📚" label="문제집 관리" active={location.pathname === '/workbooks'} onClick={() => setIsMenuOpen(false)} />
            <SidebarItem to="/classes" icon="🏫" label="반 및 출석 관리" active={location.pathname === '/classes'} onClick={() => setIsMenuOpen(false)} />
            <SidebarItem to="/learning" icon="✍️" label="학습 현황 기록" active={location.pathname === '/learning'} onClick={() => setIsMenuOpen(false)} />
            <SidebarItem to="/consultation" icon="📋" label="상담 일지" active={location.pathname === '/consultation'} onClick={() => setIsMenuOpen(false)} />
            <SidebarItem to="/account" icon="⚙️" label="내 정보 관리" active={location.pathname === '/account'} onClick={() => setIsMenuOpen(false)} />
          </nav>

          <div className="p-4 border-t border-indigo-600 bg-indigo-800/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-400 flex items-center justify-center font-bold text-white">{currentUser.name[0]}</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-[10px] text-indigo-300 uppercase">{currentUser.role === 'DIRECTOR' ? '원장님' : '선생님'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold transition-all">로그아웃</button>
          </div>
        </aside>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto">
        {cloudError && <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-sm rounded-2xl border border-rose-200">⚠️ {cloudError}</div>}
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} users={state.users} />} />
          <Route path="/" element={<Dashboard state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/teachers" element={<TeacherManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/students" element={<StudentManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/sync" element={<DataManagement state={state} updateState={setFullState} cloudStatus={cloudStatus} cloudError={cloudError} />} />
          <Route path="/workbooks" element={<WorkbookManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/classes" element={<ClassManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/learning" element={<LearningStatus state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/consultation" element={<ConsultationLogs state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/account" element={<AccountSettings currentUser={currentUser} setCurrentUser={setCurrentUser} updateState={updateState} />} />
        </Routes>
      </main>
    </div>
  );
};

const CloudBadge = ({ status }: { status: 'OFFLINE' | 'CONNECTING' | 'LIVE' }) => (
  <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${status === 'LIVE' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
    <span>{status === 'LIVE' ? '● 실시간 연동됨' : '○ 연결 안됨'}</span>
  </div>
);

const SidebarItem = ({ to, icon, label, active, onClick }: { to: string, icon: string, label: string, active: boolean, onClick: () => void }) => (
  <Link to={to} onClick={onClick} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-100 hover:bg-indigo-600'}`}>
    <span>{icon}</span>
    <span className="font-bold">{label}</span>
  </Link>
);

export default App;
