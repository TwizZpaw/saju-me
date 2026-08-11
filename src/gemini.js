import { GoogleGenAI } from '@google/genai'

/**
 * Gemini에게 사주 해석을 요청한다.
 * @param {string} prompt - buildSajuPrompt로 만든 문장
 * @returns {Promise<string>} AI가 쓴 한글 해석 결과
 */
export async function askGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY가 없습니다. .env 파일을 확인하고 개발 서버를 다시 실행하세요.'
    )
  }

  // 브라우저용 Google GenAI 클라이언트
  const ai = new GoogleGenAI({ apiKey })

  // Interactions API (공식 권장 방식)
  const interaction = await ai.interactions.create({
    model: 'gemini-3.6-flash',
    input: prompt,
  })

  // SDK가 주는 텍스트 (없으면 steps에서 찾아봄)
  if (interaction.output_text) {
    return interaction.output_text
  }

  const texts = (interaction.steps || [])
    .flatMap((step) => step.content || [])
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)

  if (texts.length > 0) {
    return texts.join('\n')
  }

  throw new Error('Gemini 응답에서 텍스트를 찾지 못했습니다.')
}
