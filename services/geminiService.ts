
import { GoogleGenAI } from "@google/genai";
import { ConsultationRecord, ProgressRecord, Student, Workbook } from "../types";

export const generateConsultationSummary = async (
  student: Student,
  progress: ProgressRecord[],
  workbooks: Workbook[],
  consultations: ConsultationRecord[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.length < 5) {
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
    ? consultations.slice(-5).map(c => `• [${c.date}] ${c.note}`).join('\n')
    : "특이사항 기록 없음";

  // AI에게 줄 데이터와 함께 '출력 양식'을 강제로 지정합니다.
  const userPrompt = `
    [학생 정보]
    성명: ${student.name}
    학년: ${student.grade}

    [학습 데이터]
    ${progressText}

    [선생님 관찰 메모]
    ${recentNotes}

    ---
    위 데이터를 바탕으로 아래 [지정 양식]에 맞춰 학부모님께 보낼 알림톡 문구를 작성하세요.
    항목명을 대괄호[]로 감싸고 내용을 작성하세요.
  `;

  const systemInstruction = `
    당신은 교육 전문 상담 가이드입니다. 반드시 아래의 '4단계 고정 양식'을 지켜서 한국어로 답변하세요.
    
    [지정 양식]:
    1. [🌟 오늘 학습 요약]: 전체적인 학습 태도와 성취도를 다정하게 한 줄로 요약합니다.
    2. [📚 상세 진도 현황]: 진행된 문제집과 페이지 정보를 일목요연하게 나열합니다.
    3. [✍️ 선생님 관찰 소견]: 관찰 메모를 바탕으로 아이의 강점이나 보완점을 전문적으로 분석합니다.
    4. [🌸 학부모님께 드리는 말씀]: 가정에서의 격려 부탁과 따뜻한 끝인사를 전합니다.

    - 말투: ~해요, ~입니다 등 다정하고 정중한 '원장님' 말투
    - 이모지: 각 항목에 어울리는 이모지를 적절히 사용
    - 금지사항: 양식 외의 불필요한 서론(네, 알겠습니다 등)은 절대 쓰지 마세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6, // 창의성보다 일관성을 위해 약간 낮춤
      }
    });
    
    if (!response.text) throw new Error("AI_EMPTY_RESPONSE");
    return response.text.trim();
  } catch (error: any) {
    const msg = error.message || "";
    console.error("Gemini Service Error:", msg);

    if (msg.includes("Paid Project") || msg.includes("billing") || msg.includes("403")) {
      throw new Error("BILLING_REQUIRED");
    }
    throw error;
  }
};
