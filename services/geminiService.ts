
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
  
  // 데이터 위주의 텍스트 구성
  const progressText = progress.length > 0 
    ? progress.map(p => {
        const wb = workbooks.find(w => w.id === p.workbookId);
        return `- ${wb?.title}: ${p.currentPage}/${wb?.totalPages}p (${Math.round((p.currentPage / (wb?.totalPages || 1)) * 100)}% 완료)`;
      }).join('\n')
    : "기록된 진도 데이터가 없습니다.";

  const recentNotes = consultations.length > 0
    ? consultations.slice(-5).map(c => `[${c.date}] ${c.note}`).join('\n')
    : "최근 관찰 기록이 없습니다.";

  const systemInstruction = `
    당신은 학원 학부모님께 학생의 학습 현황을 객관적이고 신뢰감 있게 보고하는 전문 실장입니다.
    
    [작성 가이드라인]
    1. 과한 칭찬이나 화려한 수식어는 배제하고, 담백하고 전문적인 톤을 유지하세요.
    2. 학습 진도(페이지 수, 완료율 등) 데이터를 최우선적으로 언급하여 리포트의 객관성을 높이세요.
    3. 칭찬은 선생님의 관찰 메모에 구체적인 근거가 있을 때만 '적절히' 섞어서 전달하세요.
    4. 반드시 정중한 '해요체'를 사용하세요.
    5. '학습 현황', '선생님 소견', '향후 계획' 순으로 문단을 나누어 가독성을 높이세요.
    6. 이모지는 최소한으로(섹션당 1개 정도) 사용하여 전문성을 유지하세요.
  `;

  const userPrompt = `
    학생 정보: ${student.name} (${student.grade})
    실제 진도 데이터:
    ${progressText}

    선생님 관찰 메모:
    ${recentNotes}

    위 데이터를 바탕으로 학부모님께 전달할 신뢰감 있는 브리핑을 작성해 주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5, // 창의성보다는 일관성을 위해 온도를 낮춤
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    if (!response.text) throw new Error("AI response is empty");
    return response.text.trim();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("404")) {
      throw new Error("INVALID_API_KEY");
    }
    throw error;
  }
};
