
import React, { useRef, useState, useEffect } from 'react';
import { AppState } from '../types';

interface Props {
  state: AppState;
  updateState: (state: AppState) => void;
  cloudStatus?: 'OFFLINE' | 'CONNECTING' | 'LIVE';
  cloudError?: string | null;
}

const DataManagement: React.FC<Props> = ({ state, updateState, cloudStatus, cloudError }) => {
  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('edulog_cloud_url') || '');
  const [cloudKey, setCloudKey] = useState(localStorage.getItem('edulog_cloud_key') || '');
  const [currentHostname, setCurrentHostname] = useState('');

  const savedUrl = localStorage.getItem('edulog_cloud_url');
  const isCloudLinked = !!savedUrl && cloudStatus === 'LIVE';

  const sqlCode = `-- 1. 데이터 보관함 만들기
create table if not exists app_sync (
  id text primary key,
  data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 보안 정책 초기화 (기존 정책 삭제 후 새로 생성)
drop policy if exists "Allow public access" on app_sync;

-- 3. 보안 설정 (모든 기기에서 자유롭게 읽고 쓰기 허용)
alter table app_sync enable row level security;
create policy "Allow public access" on app_sync for all using (true) with check (true);`;

  useEffect(() => {
    setCurrentHostname(window.location.origin);
  }, []);

  const handleSaveCloudConfig = () => {
    if (!cloudUrl || !cloudKey) {
      alert('주소(URL)와 열쇠(Key)를 모두 입력해 주셔야 연결이 가능합니다.');
      return;
    }
    
    if (!cloudUrl.startsWith('https://')) {
      alert('주소(URL) 형식이 올바르지 않습니다. https:// 로 시작하는지 확인해주세요.');
      return;
    }

    localStorage.setItem('edulog_cloud_url', cloudUrl.trim());
    localStorage.setItem('edulog_cloud_key', cloudKey.trim());
    alert('🎉 설정을 저장했습니다! 연결 상태를 확인하기 위해 앱이 다시 시작됩니다.');
    window.location.reload();
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    alert(msg);
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <header className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <span className="mr-2">🔄</span> 데이터 실시간 공유 설정
          </h2>
          <p className="text-slate-500 mt-1">선생님들과 데이터를 실시간으로 나누기 위한 설정입니다.</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">우리 학원 접속 주소</p>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-mono font-bold text-indigo-700">{currentHostname}</span>
            <button 
              onClick={() => copyToClipboard(currentHostname, '학원 주소가 복사되었습니다!')}
              className="bg-white p-1.5 rounded-lg border border-indigo-200 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 실시간 공유 상태 알림 */}
      <div className={`p-8 rounded-3xl border transition-all ${isCloudLinked ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-100' : (cloudStatus === 'CONNECTING' ? 'bg-amber-400 text-amber-900 border-amber-300' : 'bg-rose-50 border-rose-200')} shadow-2xl`}>
        <div className="flex items-center space-x-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${isCloudLinked ? 'bg-white text-emerald-500' : 'bg-white shadow-sm'}`}>
            {isCloudLinked ? '📡' : (cloudStatus === 'CONNECTING' ? '⏳' : '⚠️')}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              {isCloudLinked ? '실시간 클라우드 가동 중' : (cloudStatus === 'CONNECTING' ? '연결을 시도하고 있습니다...' : '클라우드 연결이 필요합니다')}
            </h3>
            {cloudError && !isCloudLinked && (
              <div className="mt-2 p-3 bg-black/10 rounded-xl text-xs font-mono">
                <strong>원인 파악:</strong> {cloudError}
              </div>
            )}
            <p className={`text-sm mt-1 ${isCloudLinked ? 'text-emerald-100' : 'text-slate-500'}`}>
              {isCloudLinked 
                ? '축하합니다! 이제 모든 기기에서 데이터가 실시간으로 공유됩니다.'
                : '아래 가이드에 따라 주소/열쇠 입력과 보관함 생성을 완료해 주세요.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Step 1 */}
        <section className={`rounded-3xl p-8 transition-all ${cloudUrl && cloudKey ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800 text-white shadow-xl'}`}>
          <h3 className={`text-xl font-bold mb-6 flex items-center ${cloudUrl && cloudKey ? 'text-slate-400' : 'text-white'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm ${cloudUrl && cloudKey ? 'bg-slate-200 text-slate-400' : 'bg-indigo-500 text-white'}`}>1</span>
            {cloudUrl && cloudKey ? '정보 입력 완료' : '클라우드 정보 입력 (URL/Key)'}
          </h3>
          <div className={`${cloudUrl && cloudKey ? 'opacity-50 pointer-events-none' : ''} space-y-5`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Project URL</label>
                <input 
                  type="text" 
                  value={cloudUrl}
                  onChange={e => setCloudUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-indigo-300 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  placeholder="https://abc.supabase.co"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Anon Key (열쇠)</label>
                <input 
                  type="password" 
                  value={cloudKey}
                  onChange={e => setCloudKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-indigo-300 outline-none focus:border-indigo-500 transition-all"
                  placeholder="공개 API 키를 넣어주세요"
                />
              </div>
            </div>
            <button 
              onClick={handleSaveCloudConfig}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
            >
              연결 정보 저장하기
            </button>
          </div>
        </section>

        {/* Step 2 */}
        <section className={`bg-white rounded-3xl p-8 border transition-all ${isCloudLinked ? 'border-slate-100 opacity-50' : 'border-indigo-200 shadow-lg'}`}>
          <h3 className="text-xl font-bold mb-4 flex items-center text-slate-800">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm ${isCloudLinked ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white'}`}>2</span>
            수파베이스 보관함 생성 (SQL 실행)
          </h3>
          <div className="space-y-6">
            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
              <h4 className="font-bold text-indigo-800 text-sm mb-2">💡 연결이 안 된다면?</h4>
              <p className="text-xs text-indigo-600 leading-relaxed">
                정보를 정확히 넣었는데도 <span className="font-bold underline">"보관함을 찾을 수 없거나 권한이 없습니다"</span>라고 뜬다면, 아래 코드를 수파베이스의 <b>SQL Editor</b>에서 실행하지 않았기 때문입니다.
              </p>
            </div>
            
            <div className="relative group">
              <div className="absolute -top-3 left-6 bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">SQL 코드</div>
              <pre className="bg-slate-900 text-indigo-300 p-6 rounded-2xl text-[11px] overflow-x-auto font-mono leading-relaxed pt-8">
                {sqlCode}
              </pre>
              <button 
                onClick={() => copyToClipboard(sqlCode, 'SQL 코드가 복사되었습니다!')}
                className="absolute top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all shadow-xl active:scale-95"
              >
                코드 전체 복사하기
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-1">순서 1</p>
                <p className="text-xs text-slate-600">수파베이스 메뉴에서 <b>SQL Editor</b>를 누릅니다.</p>
              </div>
              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-1">순서 2</p>
                <p className="text-xs text-slate-600"><b>New Query</b>를 누르고 복사한 코드를 붙여넣습니다.</p>
              </div>
              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-1">순서 3</p>
                <p className="text-xs text-slate-600">오른쪽 아래 <b>Run</b> 버튼을 누르면 끝!</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {cloudStatus === 'LIVE' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center">
          <button 
            onClick={() => {
              if (confirm('연결을 해제하시겠습니까? 데이터는 클라우드에 안전하게 보관되지만, 이 기기에서는 실시간 공유가 중단됩니다.')) {
                localStorage.removeItem('edulog_cloud_url');
                localStorage.removeItem('edulog_cloud_key');
                window.location.reload();
              }
            }}
            className="px-8 py-3 bg-rose-50 text-rose-500 rounded-xl font-bold hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            연결 해제하고 기기에만 저장하기
          </button>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
