
import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  // Vercel 등 배포 환경에서는 process.env.API_KEY가 설정되어 있어야 합니다.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY_NOT_CONFIGURED");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const progressText = progress.length > 0 
    ? progress.map(p => {
        const wb = workbooks.find(w => w.id === p.workbookId);
        return `- ${wb?.title}: ${p.currentPage}/${wb?.totalPages}p 완료`;
      }).join('\n')
    : "최근 기록된 진도 데이터가 없습니다.";

  const recentNotes = consultations.length > 0
    ? consultations.slice(-5).map(c => `• [${c.date}] ${c.note}`).join('\n')
    : "최근 기록된 관찰 소견이 없습니다.";

  const systemInstruction = `
    당신은 학원 학부모님께 학생의 학습 현황을 보고하는 전문 상담 실장입니다.
    반드시 다음의 [출력 규칙]과 [고정 양식]을 한 글자도 틀리지 말고 지키세요.

    [출력 규칙]
    1. 서론이나 결론(예: "알겠습니다", "작성해 드릴게요")을 절대 포함하지 마세요.
    2. 오직 아래의 4가지 섹션만 출력하세요.
    3. 말투는 '원장님'처럼 정중하고 다정하며 신뢰감 있는 '해요체'를 사용하세요.

    [고정 양식]
    [🌟 오늘 학습 요약]
    (오늘 학생의 전체적인 학습 태도와 몰입도를 칭찬을 담아 한 문장으로 작성)

    [📚 상세 진도 현황]
    (진도 데이터를 바탕으로 완료된 페이지 정보를 나열)

    [✍️ 선생님 관찰 소견]
    (관찰 메모를 분석하여 학생의 인지적 성취나 정서적 특징을 전문적으로 설명)

    [🌸 학부모님께 드리는 말씀]
    (가정에서의 응원 부탁과 함께 따뜻한 마무리 인사)
  `;

  const userPrompt = `
    학생 성명: ${student.name}
    학년: ${student.grade}
    오늘의 진도 상황:
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
        temperature: 0.3,
        topP: 0.8,
      }
    });
    
    if (!response.text) throw new Error("AI_EMPTY_RESPONSE");
    return response.text.trim();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
