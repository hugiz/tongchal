import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  // Use process.env.API_KEY directly as per SDK requirements
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    당신은 학원 학부모님께 학생의 학습 현황을 '데이터 기반'으로 보고하는 **통찰수학학원 원장**입니다.
    
    [작성 및 구성 원칙]
    1. **자기소개**: 첫 문장은 반드시 "안녕하세요, [학생이름] 학부모님. 통찰수학학원 원장입니다."로 시작하세요.
    2. **객관성 및 수치**: 제공된 진도 페이지수와 완료율 데이터를 활용하여 객관적인 지표를 보고하세요.
    3. **섹션 구성**: '1. 학습 지표 요약', '2. 선생님 관찰 보고', '3. 향후 지도 방향' 세 섹션으로 나누어 작성하세요.
    4. **연락처 명시**: 하단 안내 문구에 "관련하여 궁금하신 점은 언제든 문의해 주시기 바랍니다. (010-9871-5887)"를 반드시 포함하세요.
    5. **맺음말 고정**: 리포트의 맨 마지막 줄은 반드시 **통찰수학학원 원장 드림**으로 작성하세요.
    6. **어조**: 정중하고 신뢰감 있는 '해요체'를 사용하세요.
  `;

  const userPrompt = `
    대상 학생: ${student.name} (${student.grade})
    
    [수집된 학습 데이터]
    ${progressText}

    [선생님 관찰 메모 내역]
    ${recentNotes}

    위 데이터를 분석하여 원장인 제가 학부모님께 보낼 객관적이고 신뢰감 있는 브리핑 리포트를 작성해 주세요.
  `;

  try {
    // Correctly structured generateContent call following guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
      }
    });
    
    // access .text property directly
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