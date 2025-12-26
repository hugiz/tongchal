
import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  // 가이드라인: 호출 직전에 인스턴스 생성 (최신 API_KEY 반영 보장)
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY_NOT_FOUND");
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
    1. 반드시 정중하고 다정한 '해요체'를 사용하세요.
    2. 가독성을 위해 문단 사이에는 빈 줄을 추가하세요.
    3. 적절한 이모지(🌟, 📚, ✍️, 🌸)를 활용하세요.
    4. 카카오톡으로 바로 복사해서 보낼 수 있는 깔끔한 형식이어야 합니다.

    [구성]
    🌟 오늘의 학습 요약
    📚 상세 진도 현황
    ✍️ 선생님 관찰 소견
    🌸 학부모님께 드리는 메시지
  `;

  const userPrompt = `
    학생 성명: ${student.name}
    학년: ${student.grade}
    오늘의 진도:
    ${progressText}
    선생님의 기록:
    ${recentNotes}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        thinkingConfig: { thinkingBudget: 0 } // Flash 모델 latency 최적화
      }
    });
    
    if (!response.text) throw new Error("AI 응답이 비어있습니다.");
    return response.text.trim();
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("INVALID_API_KEY");
    }
    console.error("Gemini API Error:", error);
    throw error;
  }
};
