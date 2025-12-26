
import React, { useRef, useState, useEffect } from 'react';
import { AppState } from '../types';

interface Props {
  state: AppState;
  updateState: (state: AppState) => void;
}

const DataManagement: React.FC<Props> = ({ state, updateState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('edulog_cloud_url') || '');
  const [cloudKey, setCloudKey] = useState(localStorage.getItem('edulog_cloud_key') || '');
  const [currentHostname, setCurrentHostname] = useState('');

  useEffect(() => {
    setCurrentHostname(window.location.origin);
  }, []);

  const handleSaveCloudConfig = () => {
    if (!cloudUrl || !cloudKey) {
      alert('URL과 Key를 모두 입력해주세요.');
      return;
    }
    localStorage.setItem('edulog_cloud_url', cloudUrl);
    localStorage.setItem('edulog_cloud_key', cloudKey);
    alert('설정이 저장되었습니다. 실시간 동기화를 위해 페이지를 새로고침합니다.');
    window.location.reload();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('주소가 복사되었습니다! 선생님들께 전달해 주세요.');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `edulog_backup_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    if (!files || files.length === 0) return;
    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.users && importedData.students) {
          if (window.confirm('기존 데이터가 교체됩니다. 계속하시겠습니까?')) {
            updateState(importedData);
            alert('가져오기 성공!');
          }
        }
      } catch (err) { alert('파일 읽기 실패'); }
    };
  };

  const isLocal = currentHostname.includes('localhost') || currentHostname.includes('127.0.0.1');
  const isCloudLinked = !!localStorage.getItem('edulog_cloud_url');

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">시스템 관리 센터</h2>
          <p className="text-slate-500">학원 주소와 클라우드 데이터를 통합 관리합니다.</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">우리 학원 인터넷 주소</p>
          <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
            <span className="text-sm font-mono font-bold text-indigo-600">{currentHostname}</span>
            <button 
              onClick={() => copyToClipboard(currentHostname)}
              className="text-indigo-400 hover:text-indigo-600 transition-colors"
              title="주소 복사"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Cloud Importance Info */}
      <div className={`p-6 rounded-3xl border ${isCloudLinked ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
        <div className="flex items-start space-x-4">
          <div className="text-2xl">{isCloudLinked ? '✅' : '⚠️'}</div>
          <div>
            <h3 className={`font-bold ${isCloudLinked ? 'text-emerald-800' : 'text-amber-800'}`}>
              {isCloudLinked ? '클라우드가 연결되었습니다!' : '현재 기기 전용(로컬) 모드입니다.'}
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {isCloudLinked 
                ? '이제 모든 기기에서 데이터가 실시간으로 공유됩니다. 선생님들이 각자의 폰이나 PC에서 접속해도 똑같은 정보를 볼 수 있습니다.'
                : '지금은 원장님 브라우저에만 데이터가 저장됩니다. 다른 선생님들과 데이터를 공유하려면 반드시 아래 1번 과정을 진행해주세요.'}
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Sync Section */}
      <section className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold flex items-center">
              <span className="mr-2">⚡️</span> 1. 실시간 데이터 공유 설정 (Supabase)
            </h3>
            <p className="text-indigo-100 text-sm mt-1">이 설정을 마치면 "기기 전용"이 "실시간 클라우드"로 바뀝니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-indigo-200 mb-1 uppercase tracking-wider">Project URL</label>
              <input 
                type="text" 
                value={cloudUrl}
                onChange={e => setCloudUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white/50 transition-all"
                placeholder="https://xyz.supabase.co"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-200 mb-1 uppercase tracking-wider">Anon Key</label>
              <input 
                type="password" 
                value={cloudKey}
                onChange={e => setCloudKey(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white/50 transition-all"
                placeholder="eyJhbGciOiJIUzI1Ni..."
              />
            </div>
            <button 
              onClick={handleSaveCloudConfig}
              className="w-full bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
            >
              연결 설정 저장
            </button>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center">
              <span className="mr-2">🔍</span> 정보 찾는 법
            </h4>
            <ol className="text-xs text-indigo-100 space-y-2 list-decimal pl-4">
              <li><b>Supabase</b> 프로젝트 접속</li>
              <li><b>Project Settings (톱니바퀴)</b> 클릭</li>
              <li><b>API</b> 메뉴 선택</li>
              <li><b>Project URL</b>과 <b>anon</b> 키를 복사해 오세요.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Backup Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">📤</div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800">전체 데이터 백업</h4>
            <p className="text-xs text-slate-500">모든 데이터를 파일로 저장합니다.</p>
          </div>
          <button onClick={handleExport} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700">다운로드</button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">📥</div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800">백업 데이터 복구</h4>
            <p className="text-xs text-slate-500">저장된 파일을 불러옵니다.</p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700">파일 선택</button>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
