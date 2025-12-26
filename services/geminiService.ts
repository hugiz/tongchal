
import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  // 호출 직전에 process.env.API_KEY를 참조하여 인스턴스 생성
  // (openSelectKey로 주입된 키가 즉시 반영됨)
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const progressText = progress.length > 0 
    ? progress.map(p => {
        const wb = workbooks.find(w => w.id === p.workbookId);
        return `- ${wb?.title}: ${p.currentPage}/${wb?.totalPages}p 완료`;
      }).join('\n')
    : "최근 기록된 진도 데이터가 없습니다.";

  const recentNotes = consultations.length > 0
    ? consultations.slice(-5).map(c => `• ${c.note}`).join('\n')
    : "최근 기록된 관찰 소견이 없습니다.";

  const systemInstruction = `
    당신은 학원 학부모님께 학생의 학습 현황을 보고하는 전문 상담 실장입니다.
    선생님이 남긴 [관찰 메모]와 [진도 데이터]를 바탕으로 학부모님께 카카오톡으로 보낼 다정하고 전문적인 '오늘의 브리핑'을 작성하세요.

    [출력 규칙]
    1. 반드시 정중하고 다정한 '해요체'를 사용하세요. (예: ~했습니다 -> ~했어요)
    2. 가독성을 위해 문단 사이에는 반드시 빈 줄을 추가하세요.
    3. 적절한 이모지(🌟, 📚, ✍️, 🌸)를 섹션마다 활용하세요.
  `;

  const userPrompt = `
    학생 성명: ${student.name}
    학년: ${student.grade}
    진도 상황: ${progressText}
    선생님 기록: ${recentNotes}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    if (!response.text) throw new Error("AI response is empty");
    return response.text.trim();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // 키 관련 에러 발생 시 상위 컴포넌트에서 감지할 수 있도록 에러 메시지 전달
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("404")) {
      throw new Error("INVALID_API_KEY");
    }
    throw error;
  }
};
