
import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const progressText = progress.map(p => {
    const wb = workbooks.find(w => w.id === p.workbookId);
    return `${wb?.title}: ${p.currentPage}/${wb?.totalPages} 페이지 진행`;
  }).join(', ');

  const recentNotes = consultations.slice(-3).map(c => `[${c.date}] ${c.note}`).join('\n');

  const prompt = `
    다음은 학생의 최근 학습 현황과 교사 상담 기록입니다.
    학부모님께 보낼 정중하고 전문적인 학습 성취도 요약 메시지를 작성해주세요.
    
    학생 이름: ${student.name} (${student.grade})
    현재 학습 진도: ${progressText}
    최근 교사 소견:
    ${recentNotes}
    
    응답은 한국어로, 친절한 말투(~해요 체)로 작성하고, 구체적인 칭찬과 격려를 포함해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text || "요약을 생성할 수 없습니다.";
  } catch (error) {
    console.error("AI Summary generation failed", error);
    return "AI 요약 생성 중 오류가 발생했습니다.";
  }
};
