
import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  // 매번 새로운 인스턴스를 생성하여 최신 API 키가 즉시 반영되도록 함
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
    
    위의 학습 데이터를 바탕으로 학부모님께 보낼 따뜻하고 전문적인 브리핑 메시지를 한국어로 작성해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt, // 형식을 단순화하여 전송 오류 방지
      config: {
        systemInstruction: "당신은 학원 운영 20년 차 베테랑 상담 전문가입니다. 학생의 진도와 교사 소견을 바탕으로 학부모님이 안심하고 감동하실 수 있는 학습 보고서를 작성합니다. 반드시 한국어로 작성하며, '~해요' 체를 사용하세요. 학생의 이름을 언급하며 구체적인 칭찬을 포함해 주세요.",
        temperature: 0.7,
        topP: 0.95,
      }
    });
    
    if (!response.text) {
      throw new Error("AI 응답 내용이 비어있습니다.");
    }
    
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error Details:", error);
    
    // 구체적인 에러 메시지 반환
    if (error.message?.includes("API_KEY")) {
      return "API 키 설정에 문제가 있습니다. 설정 메뉴에서 확인해 주세요.";
    }
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      return "선택한 AI 모델을 사용할 수 없습니다. 모델 설정을 확인해 주세요.";
    }
    
    throw error; // UI의 catch 블록으로 전달
  }
};
