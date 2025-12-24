
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

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">시스템 관리 및 배포</h2>
          <p className="text-slate-500">인터넷 주소를 설정하고 클라우드 데이터를 연동합니다.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">현재 접속 주소</p>
          <p className="text-sm font-mono font-bold text-indigo-600">{currentHostname}</p>
        </div>
      </header>

      {/* Cloud Sync Section */}
      <section className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold flex items-center">
              <span className="mr-2">⚡️</span> 1. 실시간 클라우드 연결 (Supabase)
            </h3>
            <p className="text-indigo-100 text-sm mt-1">데이터베이스 주소를 입력하면 모든 PC에서 동기화됩니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-indigo-200 mb-1 uppercase tracking-wider">Project URL (주소)</label>
              <input 
                type="text" 
                value={cloudUrl}
                onChange={e => setCloudUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white/50 transition-all"
                placeholder="https://xyz.supabase.co"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-200 mb-1 uppercase tracking-wider">Anon Key (비밀키)</label>
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

          <div className="bg-white/10 rounded-2xl p-6 border border-white/10 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center">
              <span className="mr-2">🔍</span> 어디서 찾나요?
            </h4>
            <ol className="text-xs text-indigo-100 space-y-3 list-decimal pl-4">
              <li><a href="https://supabase.com" target="_blank" className="underline font-bold text-white">Supabase 접속</a> 후 프로젝트 선택</li>
              <li>좌측 하단 <b>Settings (톱니바퀴)</b> 클릭</li>
              <li><b>API</b> 메뉴 클릭</li>
              <li><b>Project URL</b>과 <b>anon public</b> 항목을 복사해서 붙여넣으세요.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Public Deployment Guide */}
      <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center relative z-10">
          <span className="mr-2">🌐</span> 2. 나만의 인터넷 주소 생성 (Vercel)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Vercel을 이용하면 <span className="font-bold text-indigo-600">https://우리교습소.vercel.app</span> 같은 주소를 무료로 만들 수 있습니다. 학원 밖에서도 접속하려면 이 과정이 필수입니다.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">1</div>
                <p className="text-sm text-slate-700">GitHub에 코드를 업로드하세요.</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">2</div>
                <p className="text-sm text-slate-700">Vercel에서 해당 저장소를 불러와 <b>Deploy</b>를 누르세요.</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">3</div>
                <p className="text-sm text-slate-700">생성된 주소를 선생님들과 공유하세요.</p>
              </div>
            </div>

            <a href="https://vercel.com/new" target="_blank" className="inline-block bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg">
              지금 주소 만들기 →
            </a>
          </div>

          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <h4 className="text-sm font-bold text-amber-800 flex items-center mb-4">
              <span className="mr-2">⚠️</span> 주의: AI 기능 활성화
            </h4>
            <p className="text-xs text-amber-700 leading-relaxed space-y-2">
              인터넷 주소로 접속했을 때 AI 상담 요약 기능이 작동하게 하려면, Vercel 설정 창의 <b>Environment Variables</b> 메뉴에 다음 값을 추가해야 합니다:
            </p>
            <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200 font-mono text-[10px] text-slate-600">
              <b>Key:</b> API_KEY <br/>
              <b>Value:</b> (원장님의 Gemini API 키)
            </div>
          </div>
        </div>
      </section>

      {/* Manual Sync */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">📤</div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800">오프라인 백업</h4>
            <p className="text-xs text-slate-500">현재 데이터를 파일로 내려받습니다.</p>
          </div>
          <button onClick={handleExport} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold">다운로드</button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">📥</div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800">데이터 불러오기</h4>
            <p className="text-xs text-slate-500">백업 파일을 업로드하여 복구합니다.</p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold">파일 선택</button>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
