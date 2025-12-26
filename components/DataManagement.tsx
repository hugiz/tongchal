
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
  const [isSaving, setIsSaving] = useState(false);

  const isCloudLinked = cloudStatus === 'LIVE';

  useEffect(() => {
    // 호스트네임뿐만 아니라 현재 페이지의 전체 기본 경로를 가져옴
    setCurrentHostname(window.location.origin + window.location.pathname);
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

    setIsSaving(true);
    localStorage.setItem('edulog_cloud_url', cloudUrl.trim());
    localStorage.setItem('edulog_cloud_key', cloudKey.trim());
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    alert(msg);
  };

  // 선생님들을 위한 자동 설정 링크 생성
  const generateInviteLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const encodedUrl = encodeURIComponent(cloudUrl.trim());
    const encodedKey = encodeURIComponent(cloudKey.trim());
    return `${baseUrl}?c_url=${encodedUrl}&c_key=${encodedKey}`;
  };

  const sqlCode = `-- 1. 데이터 보관함 만들기
create table if not exists app_sync (
  id text primary key,
  data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 보안 정책 초기화
drop policy if exists "Allow public access" on app_sync;

-- 3. 보안 설정
alter table app_sync enable row level security;
create policy "Allow public access" on app_sync for all using (true) with check (true);`;

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
            <span className="text-sm font-mono font-bold text-indigo-700">{window.location.origin}</span>
            <button 
              onClick={() => copyToClipboard(window.location.origin, '학원 주소가 복사되었습니다!')}
              className="bg-white p-1.5 rounded-lg border border-indigo-200 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 초대용 매직 링크 섹션 (새로 추가) */}
      {isCloudLinked && (
        <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl animate-in fade-in zoom-in duration-500">
          <div className="flex items-start space-x-5">
            <div className="bg-white/20 p-4 rounded-2xl text-3xl">✉️</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">선생님 초대하기 (자동 설정)</h3>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                다른 선생님들께 아래 링크를 보내주세요. 링크를 클릭하면 <b>주소나 키를 입력할 필요 없이</b> 자동으로 원장님의 학원 시스템에 연결됩니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => copyToClipboard(generateInviteLink(), '선생님 초대용 자동 설정 링크가 복사되었습니다! 카톡으로 전달하세요.')}
                  className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>초대 링크 복사하기</span>
                </button>
              </div>
              <p className="mt-4 text-[10px] text-indigo-200 italic">※ 주의: 이 링크에는 보안용 열쇠 정보가 포함되어 있으므로 외부 유출에 주의하세요.</p>
            </div>
          </div>
        </section>
      )}

      {/* 실시간 공유 상태 알림 */}
      <div className={`p-8 rounded-3xl border transition-all ${isCloudLinked ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : (cloudStatus === 'CONNECTING' ? 'bg-amber-400 text-amber-900 border-amber-300' : 'bg-rose-50 border-rose-200')} shadow-sm`}>
        <div className="flex items-center space-x-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${isCloudLinked ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white shadow-sm'}`}>
            {isCloudLinked ? '📡' : (cloudStatus === 'CONNECTING' ? '⏳' : '⚠️')}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              {isCloudLinked ? '실시간 클라우드 가동 중' : (cloudStatus === 'CONNECTING' ? '연결을 시도하고 있습니다...' : '클라우드 연결 정보가 필요합니다')}
            </h3>
            {cloudError && !isCloudLinked && (
              <div className="mt-3 p-4 bg-rose-500 text-white rounded-2xl text-xs font-mono border border-rose-400">
                <strong className="block mb-1">🛠️ 문제 발생:</strong> {cloudError}
              </div>
            )}
            <p className={`text-sm mt-1 ${isCloudLinked ? 'text-emerald-600' : 'text-slate-500'}`}>
              {isCloudLinked 
                ? '현재 모든 기기에서 데이터가 실시간으로 공유되고 있습니다.'
                : '아래 가이드에 따라 주소/열쇠 입력과 보관함 생성을 완료해 주세요.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 opacity-60 hover:opacity-100 transition-opacity">
        {/* Step 1 */}
        <section className={`rounded-3xl p-8 bg-slate-800 text-white shadow-xl`}>
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm bg-indigo-500 text-white`}>1</span>
            클라우드 정보 입력 (URL/Key)
          </h3>
          <div className="space-y-5">
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
                  placeholder="공개 API 키"
                />
              </div>
            </div>
            <button 
              onClick={handleSaveCloudConfig}
              disabled={isSaving}
              className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 ${isSaving ? 'bg-slate-600' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
            >
              {isSaving ? '저장 중...' : '연결 정보 저장 및 다시 시도'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DataManagement;
