
import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // 데이터 위주의 텍스트 구성 (수치 강조)
  const progressText = progress.length > 0 
    ? progress.map(p => {
        const wb = workbooks.find(w => w.id === p.workbookId);
        const total = wb?.totalPages || 1;
        const percent = Math.round((p.currentPage / total) * 100);
        return `- ${wb?.title}: 현재 ${p.currentPage}p 완료 (전체 대비 약 ${percent}%)`;
      }).join('\n')
    : "최근 기록된 구체적인 진도 데이터가 없습니다.";

  const recentNotes = consultations.length > 0
    ? consultations.slice(-5).map(c => `[${c.date}] ${c.note}`).join('\n')
    : "기록된 선생님 관찰 소견이 없습니다.";

  const systemInstruction = `
    당신은 학원 학부모님께 학생의 학습 현황을 '데이터 기반'으로 보고하는 전문 교육 상담 실장입니다.
    
    [작성 원칙]
    1. **객관성 우선**: 과도한 칭찬이나 감성적인 수식어(예: 천재적이다, 최고다)를 배제하고 담백한 전문 용어를 사용하세요.
    2. **수치 활용**: 제공된 진도 페이지수와 완료율 데이터를 문장의 서두에 배치하여 신뢰도를 높이세요.
    3. **균형 잡힌 시각**: 잘하고 있는 점은 구체적 근거(메모)를 들어 칭찬하되, 개선이 필요한 부분이나 향후 집중해야 할 학습 포인트를 명확히 짚어주세요.
    4. **형식 유지**: '학습 지표 요약', '선생님 관찰 보고', '향후 지도 방향' 세 섹션으로 나누어 작성하세요.
    5. **어조**: 정중하고 신뢰감 있는 '해요체'를 사용하세요.
  `;

  const userPrompt = `
    대상 학생: ${student.name} (${student.grade})
    
    [수집된 학습 데이터]
    ${progressText}

    [선생님 관찰 메모 내역]
    ${recentNotes}

    위 데이터를 분석하여 학부모님께 보낼 객관적이고 신뢰감 있는 브리핑 리포트를 작성해 주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // 일관된 보고를 위해 낮은 온도 설정
      }
    });
    
    if (!response.text) throw new Error("AI response is empty");
    return response.text.trim();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("404")) {
      throw new Error("INVALID_API_KEY");
    }
    throw error;
  }
};
