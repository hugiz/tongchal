
import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  // 함수 내부에서 인스턴스 생성 (최신 API 키 반영 보장)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const progressText = progress.length > 0 
    ? progress.map(p => {
        const wb = workbooks.find(w => w.id === p.workbookId);
        return `${wb?.title}: ${p.currentPage}/${wb?.totalPages} 페이지 진행`;
      }).join(', ')
    : "진도 기록 없음";

  const recentNotes = consultations.length > 0
    ? consultations.slice(-3).map(c => `[${c.date}] ${c.note}`).join('\n')
    : "최근 상담 기록 없음";

  const userPrompt = `
    학생 이름: ${student.name} (${student.grade})
    현재 학습 진도: ${progressText}
    최근 교사 소견:
    ${recentNotes}
    
    위 데이터를 바탕으로 학부모님께 보낼 브리핑 메시지를 작성해줘.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: "당신은 학원 운영 20년 차 베테랑 상담 전문가입니다. 학생의 진도와 교사 소견을 바탕으로 학부모님이 안심하고 감동하실 수 있는 따뜻하고 전문적인 학습 보고서를 작성합니다. 반드시 한국어로 작성하며, '~해요' 체를 사용하세요. 학생의 이름을 언급하며 구체적인 칭찬을 포함해 주세요.",
        temperature: 0.7,
        topP: 0.95,
        // 요약 작업의 속도를 위해 생각(추론) 예산을 0으로 설정하여 지연 시간을 최소화합니다.
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    return response.text || "내용을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  } catch (error: any) {
    console.error("AI Summary generation failed:", error);
    if (error.message?.includes("API_KEY")) {
      return "API 키 설정에 문제가 있습니다. 관리자에게 문의하세요.";
    }
    return "AI 서버 응답이 지연되고 있습니다. 다시 한번 [요약] 버튼을 눌러주세요.";
  }
};
