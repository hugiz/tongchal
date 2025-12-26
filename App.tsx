
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
import Login from './components/Login';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('edulog_state');
    if (!saved) return INITIAL_STATE;
    
    try {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_STATE,
        ...parsed,
        users: parsed.users || INITIAL_STATE.users,
        students: (parsed.students || []).map((s: any) => ({
          ...s,
          attendanceDays: s.attendanceDays || ['월', '수', '금'],
          workbooks: s.workbooks || []
        })),
        classes: (parsed.classes || []).map((c: any) => ({
          ...c,
          attendanceDays: c.attendanceDays || ['월', '수', '금'],
          workbooks: c.workbooks || []
        })),
        workbooks: parsed.workbooks || INITIAL_STATE.workbooks,
        progress: parsed.progress || [],
        consultations: parsed.consultations || [],
        attendance: parsed.attendance || []
      };
    } catch (e) {
      console.error("State parse error, fallback to INITIAL_STATE", e);
      return INITIAL_STATE;
    }
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

  const refreshFromCloud = useCallback(async () => {
    if (!supabaseRef.current) return;
    try {
      setCloudStatus('CONNECTING');
      const { data, error } = await supabaseRef.current.from('app_sync').select('data').eq('id', 'global_state').single();
      if (error) throw error;
      if (data && data.data) {
        setState(data.data);
        setCloudStatus('LIVE');
      }
    } catch (err: any) {
      setCloudError(`새로고침 실패: ${err.message}`);
      setCloudStatus('OFFLINE');
    }
  }, []);

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

  const isDirector = currentUser?.role === 'DIRECTOR';
  const roleLabel = isDirector ? '원장' : '선생님';
  const sidebarName = currentUser?.name || '';
  const needsLabel = !sidebarName.includes(roleLabel);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* 모바일용 메뉴 버튼 - 미니멀한 SVG 디자인으로 개선 */}
      {currentUser && (
        <button 
          onClick={() => setIsMenuOpen(true)}
          className={`md:hidden fixed top-4 left-4 z-[40] bg-white text-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50 transition-all active:scale-90 ${isMenuOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      )}

      {currentUser && (
        <>
          {/* 모바일 전용 배경 오버레이 */}
          {isMenuOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[50] md:hidden animate-in fade-in duration-300"
              onClick={() => setIsMenuOpen(false)}
            />
          )}

          <aside className={`
            fixed inset-y-0 left-0 z-[60] w-72 bg-indigo-700 text-white flex flex-col shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            md:static md:translate-x-0 md:h-screen md:w-64 md:shadow-xl
            ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            {/* 사이드바 내부 닫기 버튼 - 스타일 개선 */}
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="md:hidden absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:rotate-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-indigo-700 font-black text-lg">T</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight italic">EduLog</h1>
              </div>
              <div className="mt-4" title="데이터 연동 상태"><CloudBadge status={cloudStatus} /></div>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
              <SidebarItem to="/" icon="📊" label="대시보드" active={location.pathname === '/'} onClick={() => setIsMenuOpen(false)} />
              <div className="pt-4 pb-2 px-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">학원 관리</div>
              {isDirector && (
                <>
                  <SidebarItem to="/teachers" icon="👩‍🏫" label="교사 관리" active={location.pathname === '/teachers'} onClick={() => setIsMenuOpen(false)} />
                  <SidebarItem to="/sync" icon="🔄" label="데이터 동기화" active={location.pathname === '/sync'} onClick={() => setIsMenuOpen(false)} />
                </>
              )}
              <SidebarItem to="/students" icon="👥" label="학생 관리" active={location.pathname === '/students'} onClick={() => setIsMenuOpen(false)} />
              <SidebarItem to="/workbooks" icon="📚" label="문제집 관리" active={location.pathname === '/workbooks'} onClick={() => setIsMenuOpen(false)} />
              <SidebarItem to="/classes" icon="🏫" label="반 및 출석 관리" active={location.pathname === '/classes'} onClick={() => setIsMenuOpen(false)} />
              <div className="pt-4 pb-2 px-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">학습 기록</div>
              <SidebarItem to="/learning" icon="✍️" label="학습 현황 기록" active={location.pathname === '/learning'} onClick={() => setIsMenuOpen(false)} />
              <SidebarItem to="/consultation" icon="📋" label="상담 일지" active={location.pathname === '/consultation'} onClick={() => setIsMenuOpen(false)} />
              <div className="pt-4 pb-2 px-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">계정 설정</div>
              <SidebarItem to="/account" icon="⚙️" label="내 정보 관리" active={location.pathname === '/account'} onClick={() => setIsMenuOpen(false)} />
            </nav>

            <div className="p-6 border-t border-indigo-600 bg-indigo-800/40">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-400 border border-indigo-300/30 flex items-center justify-center font-black text-white shadow-lg">{sidebarName?.[0] || 'U'}</div>
                <div className="overflow-hidden">
                  <p className="text-sm font-black truncate leading-tight">{sidebarName}</p>
                  {needsLabel && <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{roleLabel}</p>}
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-3 bg-white/10 hover:bg-rose-500 rounded-xl text-xs font-black transition-all border border-white/5 flex items-center justify-center gap-2">
                <span>🚪</span> 로그아웃
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="flex-1 overflow-y-auto p-5 md:p-10 max-w-7xl mx-auto w-full pt-20 md:pt-10">
        {cloudError && (
          <div className="mb-8 p-5 bg-rose-50 text-rose-700 text-sm rounded-3xl border border-rose-200 flex justify-between items-center shadow-lg shadow-rose-500/5">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{cloudError}</span>
            </div>
            <button onClick={() => setCloudError(null)} className="bg-rose-100 hover:bg-rose-200 p-2 rounded-xl transition-all">✕</button>
          </div>
        )}
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} users={state.users} />} />
          <Route path="/" element={<Dashboard state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/teachers" element={<TeacherManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/students" element={<StudentManagement state={state} updateState={updateState} user={currentUser} />} />
          <Route path="/sync" element={<DataManagement state={state} updateState={setFullState} cloudStatus={cloudStatus} cloudError={cloudError} onRefresh={refreshFromCloud} />} />
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
  <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-[10px] font-black transition-all border ${
    status === 'LIVE' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20 shadow-lg shadow-emerald-500/10' : 
    status === 'CONNECTING' ? 'bg-amber-500/10 text-amber-300 border-amber-400/20 animate-pulse' : 
    'bg-rose-500/10 text-rose-300 border-rose-400/20'
  }`}>
    <span className={`w-2 h-2 rounded-full ${status === 'LIVE' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : status === 'CONNECTING' ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
    <span className="tracking-tight uppercase">{status === 'LIVE' ? 'Cloud Synchronized' : status === 'CONNECTING' ? 'Syncing...' : 'Local Only'}</span>
  </div>
);

const SidebarItem = ({ to, icon, label, active, onClick }: { to: string, icon: string, label: string, active: boolean, onClick: () => void }) => (
  <Link to={to} onClick={onClick} className={`flex items-center space-x-3.5 px-5 py-3.5 rounded-2xl transition-all group ${active ? 'bg-white text-indigo-700 shadow-xl shadow-indigo-900/20 font-black' : 'text-indigo-100 hover:bg-white/10 font-bold'}`}>
    <span className={`text-lg transition-transform group-hover:scale-125 ${active ? 'filter-none' : 'filter-none'}`}>{icon}</span>
    <span className="tracking-tight">{label}</span>
  </Link>
);

export default App;
