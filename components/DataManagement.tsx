
import React, { useState, useEffect } from 'react';
import { AppState } from '../types';

interface Props {
  state: AppState;
  updateState: (state: AppState) => void;
  cloudStatus?: 'OFFLINE' | 'CONNECTING' | 'LIVE';
  cloudError?: string | null;
  onRefresh?: () => Promise<void>;
}

const DataManagement: React.FC<Props> = ({ state, updateState, cloudStatus, cloudError, onRefresh }) => {
  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('edulog_cloud_url') || '');
  const [cloudKey, setCloudKey] = useState(localStorage.getItem('edulog_cloud_key') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      alert('클라우드로부터 최신 정보를 성공적으로 불러왔습니다.');
    } catch (e) {
      alert('새로고침 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLive = cloudStatus === 'LIVE';

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">데이터 실시간 동기화</h2>
          <p className="text-slate-500">다른 기기(PC/모바일)와 데이터를 실시간으로 공유합니다.</p>
        </div>
        {isLive && (
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isRefreshing ? 'bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 shadow-sm'
            }`}
          >
            {isRefreshing ? '⏳ 동기화 중...' : '🔄 강제 새로고침'}
          </button>
        )}
      </header>

      <div className={`p-6 rounded-3xl border transition-all ${isLive ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-500/10' : 'bg-rose-50 border-rose-100'}`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${isLive ? 'bg-emerald-500 text-white animate-bounce-short' : 'bg-rose-500 text-white'}`}>
            {isLive ? '✓' : '!'}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">{isLive ? '클라우드 연동 완료' : '연결 되지 않음'}</h3>
            <p className="text-sm text-slate-500">
              {isLive ? '모든 데이터가 선생님들과 실시간으로 공유되고 있습니다.' : '아래 정보를 입력하여 클라우드에 연결하세요.'}
            </p>
          </div>
        </div>
        {cloudError && <div className="mt-4 p-3 bg-white/50 rounded-lg text-xs font-mono text-rose-700">{cloudError}</div>}
      </div>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          Supabase 클라우드 설정
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Project URL</label>
            <input 
              type="text" 
              value={cloudUrl}
              onChange={e => setCloudUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="https://your-project.supabase.co"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Anon Key</label>
            <input 
              type="password" 
              value={cloudKey}
              onChange={e => setCloudKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Supabase API Key"
            />
          </div>
          <button 
            onClick={handleSaveCloudConfig}
            disabled={isSaving}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSaving ? '연결 중...' : '클라우드 설정 저장'}
          </button>
        </div>
      </section>

      <div className="p-6 bg-slate-100 rounded-3xl text-xs text-slate-500 leading-relaxed space-y-3">
        <p className="font-bold text-slate-700">💡 데이터가 안 보일 때 확인하세요:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>선생님들의 기기에서도 동일한 <strong>Project URL</strong>과 <strong>Key</strong>가 설정되어 있나요?</li>
          <li>상단 배지가 <span className="text-emerald-600 font-black">초록색(실시간 연동 중)</span>으로 표시되나요?</li>
          <li>인터넷 연결이 원활한가요?</li>
          <li>그래도 안 보인다면 상단의 <strong>[🔄 강제 새로고침]</strong> 버튼을 눌러보세요.</li>
        </ol>
      </div>
    </div>
  );
};

export default DataManagement;
