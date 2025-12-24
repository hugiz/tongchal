
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
import Login from './components/Login';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('edulog_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'OFFLINE' | 'CONNECTING' | 'LIVE'>('OFFLINE');
  const supabaseRef = useRef<SupabaseClient | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Initialize Supabase if credentials exist
  useEffect(() => {
    const url = localStorage.getItem('edulog_cloud_url');
    const key = localStorage.getItem('edulog_cloud_key');

    if (url && key) {
      try {
        setCloudStatus('CONNECTING');
        const client = createClient(url, key);
        supabaseRef.current = client;

        // Fetch initial data from cloud
        client.from('app_sync').select('data').eq('id', 'global_state').single()
          .then(({ data, error }) => {
            if (data && data.data) {
              setState(data.data);
              setCloudStatus('LIVE');
            } else if (error && error.code === 'PGRST116') {
              // Row doesn't exist, create it with current state
              client.from('app_sync').insert([{ id: 'global_state', data: state }]).then(() => setCloudStatus('LIVE'));
            }
          });

        // Subscribe to real-time changes
        const subscription = client
          .channel('schema-db-changes')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_sync' }, (payload) => {
            if (payload.new && payload.new.id === 'global_state') {
              setState(payload.new.data);
            }
          })
          .subscribe();

        return () => {
          client.removeChannel(subscription);
        };
      } catch (err) {
        console.error('Cloud connection failed', err);
        setCloudStatus('OFFLINE');
      }
    }
  }, []);

  // 2. Persist to LocalStorage and push to Cloud on change
  useEffect(() => {
    localStorage.setItem('edulog_state', JSON.stringify(state));
    
    // Push to cloud if live (Debounced would be better in production)
    if (cloudStatus === 'LIVE' && supabaseRef.current) {
      supabaseRef.current.from('app_sync').update({ data: state }).eq('id', 'global_state')
        .then(({ error }) => {
          if (error) console.error('Cloud push failed', error);
        });
    }
  }, [state, cloudStatus]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigate('/');
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
      {/* Sidebar and Mobile Header same as before */}
      {currentUser && (
        <header className="md:hidden sticky top-0 z-30 bg-indigo-700 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-white outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold tracking-tight">EduLog</h1>
          </div>
          <div className="flex items-center space-x-2">
            <CloudBadge status={cloudStatus} />
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold border border-indigo-400">
              {currentUser.name[0]}
            </div>
          </div>
        </header>
      )}

      {/* Sidebar Overlay (Mobile) */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      )}

      {currentUser && (
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-indigo-700 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
          md:static md:translate-x-0 md:h-screen md:shadow-xl
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">EduLog</h1>
              <div className="flex items-center mt-1">
                 <CloudBadge status={cloudStatus} />
                 <span className="text-indigo-200 text-[10px] ml-2">학원 통합 관리</span>
              </div>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="md:hidden p-2 text-indigo-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            <SidebarItem to="/" icon="📊" label="대시보드" active={location.pathname === '/'} onClick={() => setIsMenuOpen(false)} />
            {currentUser.role === 'DIRECTOR' && (
              <>
                <SidebarItem to="/teachers" icon="👩‍🏫" label="교사 관리" active={location.pathname === '/teachers'} onClick={() => setIsMenuOpen(false)} />
                <SidebarItem to="/students" icon="👥" label="학생 관리" active={location.pathname === '/students'} onClick={() => setIsMenuOpen(false)} />
                <SidebarItem to="/sync" icon="🔄" label="데이터 동기화" active={location.pathname === '/sync'} onClick={() => setIsMenuOpen(false)} />
              </>
            )}
            <SidebarItem to="/workbooks" icon="📚" label="문제집 관리" active={location.pathname === '/workbooks'} onClick={() => setIsMenuOpen(false)} />
            <SidebarItem to="/classes" icon="🏫" label="반 및 출석 관리" active={location.pathname === '/classes'} onClick={() => setIsMenuOpen(false)} />
            <SidebarItem to="/learning" icon="✍️" label="학습 현황 기록" active={location.pathname === '/learning'} onClick={() => setIsMenuOpen(false)} />
            <SidebarItem to="/consultation" icon="📋" label="상담 일지" active={location.pathname === '/consultation'} onClick={() => setIsMenuOpen(false)} />
          </nav>

          <div className="p-4 border-t border-indigo-600 bg-indigo-800/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-400 flex items-center justify-center font-bold text-white">
                {currentUser.name[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-xs text-indigo-300 truncate">{currentUser.role === 'DIRECTOR' ? '원장님' : '선생님'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-2 bg-indigo-900/50 hover:bg-rose-600 rounded-xl text-xs transition-all flex items-center justify-center space-x-2">
              <span>로그아웃</span>
            </button>
          </div>
        </aside>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} users={state.users} />} />
            <Route path="/" element={<Dashboard state={state} user={currentUser} />} />
            <Route path="/teachers" element={<TeacherManagement state={state} updateState={updateState} />} />
            <Route path="/students" element={<StudentManagement state={state} updateState={updateState} />} />
            <Route path="/sync" element={<DataManagement state={state} updateState={setFullState} />} />
            <Route path="/workbooks" element={<WorkbookManagement state={state} updateState={updateState} />} />
            <Route path="/classes" element={<ClassManagement state={state} updateState={updateState} user={currentUser} />} />
            <Route path="/learning" element={<LearningStatus state={state} updateState={updateState} user={currentUser} />} />
            <Route path="/consultation" element={<ConsultationLogs state={state} updateState={updateState} user={currentUser} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const CloudBadge = ({ status }: { status: 'OFFLINE' | 'CONNECTING' | 'LIVE' }) => (
  <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-[9px] font-bold ${
    status === 'LIVE' ? 'bg-emerald-100 text-emerald-700' : 
    status === 'CONNECTING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
  }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${status === 'LIVE' ? 'bg-emerald-500 pulse-green' : 'bg-slate-400'}`}></div>
    <span>{status === 'LIVE' ? 'CLOUD LIVE' : status === 'CONNECTING' ? 'SYNCING...' : 'LOCAL ONLY'}</span>
  </div>
);

const SidebarItem = ({ to, icon, label, active, onClick }: { to: string, icon: string, label: string, active: boolean, onClick: () => void }) => (
  <Link to={to} onClick={onClick} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
    active ? 'bg-white text-indigo-700 shadow-lg' : 'text-indigo-100 hover:bg-indigo-600'
  }`}>
    <span className="text-xl">{icon}</span>
    <span className="font-semibold">{label}</span>
  </Link>
);

export default App;
