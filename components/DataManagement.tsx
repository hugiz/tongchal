
import React, { useState, useEffect } from 'react';
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
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCloudConfig = () => {
    if (!cloudUrl || !cloudKey) {
      alert('주소(URL)와 키(Key)를 모두 입력해야 합니다.');
      return;
    }
    setIsSaving(true);
    localStorage.setItem('edulog_cloud_url', cloudUrl.trim());
    localStorage.setItem('edulog_cloud_key', cloudKey.trim());
    
    // 강제 새로고침으로 재연결 시도
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const isLive = cloudStatus === 'LIVE';

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">데이터 실시간 동기화</h2>
        <p className="text-slate-500">다른 기기(PC/모바일)와 데이터를 실시간으로 공유합니다.</p>
      </header>

      <div className={`p-6 rounded-3xl border ${isLive ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-100'}`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isLive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
            {isLive ? '✓' : '!'}
          </div>
          <div>
            <h3 className="font-bold text-lg">{isLive ? '실시간 연결 중' : '연결 되지 않음'}</h3>
            <p className="text-sm opacity-70">
              {isLive ? '모든 데이터가 클라우드에 안전하게 저장되고 있습니다.' : '아래 정보를 입력하여 클라우드에 연결하세요.'}
            </p>
          </div>
        </div>
        {cloudError && <div className="mt-4 p-3 bg-white/50 rounded-lg text-xs font-mono text-rose-700">{cloudError}</div>}
      </div>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-700">Supabase 클라우드 설정</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Project URL</label>
            <input 
              type="text" 
              value={cloudUrl}
              onChange={e => setCloudUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
              placeholder="https://your-project.supabase.co"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Anon Key</label>
            <input 
              type="password" 
              value={cloudKey}
              onChange={e => setCloudKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
              placeholder="Supabase API Key"
            />
          </div>
          <button 
            onClick={handleSaveCloudConfig}
            disabled={isSaving}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all"
          >
            {isSaving ? '저장 및 연결 중...' : '설정 저장 후 다시 연결'}
          </button>
        </div>
      </section>

      <div className="p-6 bg-slate-100 rounded-2xl text-xs text-slate-500 leading-relaxed">
        <p className="font-bold mb-2">💡 연결 팁:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Supabase에서 프로젝트를 생성한 후 URL과 Key를 복사해 오세요.</li>
          <li>처음 연결 시 'app_sync' 테이블이 자동으로 생성됩니다.</li>
          <li>연결이 성공하면 상단 배지가 초록색으로 변합니다.</li>
        </ol>
      </div>
    </div>
  );
};

export default DataManagement;
