
import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  // 호출 시점의 최신 API 키 확인
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_NOT_SET");
  }

  // 매 호출마다 새로운 인스턴스를 생성하여 선택된 키가 즉시 반영되도록 함
  const ai = new GoogleGenAI({ apiKey });
  
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
      contents: userPrompt,
      config: {
        systemInstruction: "당신은 학원 운영 20년 차 베테랑 상담 전문가입니다. 학생의 진도와 교사 소견을 바탕으로 학부모님이 안심하고 감동하실 수 있는 학습 보고서를 작성합니다. 반드시 한국어로 작성하며, '~해요' 체를 사용하세요. 학생의 이름을 언급하며 구체적인 칭찬을 포함해 주세요.",
        temperature: 0.7,
      }
    });
    
    if (!response.text) {
      throw new Error("응답을 받지 못했습니다.");
    }
    
    return response.text;
  } catch (error: any) {
    const errorMsg = error.message || "";
    console.error("Gemini API Error:", error);
    
    // 특정 오류 코드 처리 (API 키 관련)
    if (errorMsg.includes("API Key must be set") || errorMsg.includes("403") || errorMsg.includes("401")) {
      throw new Error("API_KEY_INVALID");
    }
    
    if (errorMsg.includes("Requested entity was not found")) {
      throw new Error("ENTITY_NOT_FOUND");
    }
    
    throw error;
  }
};
